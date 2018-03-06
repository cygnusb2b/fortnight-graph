const createError = require('http-errors');
const Placement = require('../../models/placement');
const Template = require('../../models/template');
const AnalyticsRequest = require('../../models/analytics/request');
const AnalyticsRequestObject = require('../../models/analytics/request-object');
const TemplateRepo = require('../../repositories/template');
const Campaign = require('../../models/campaign');
const randomBetween = require('../../utils/random-between');

module.exports = {
  parseOptions(options) {
    if (!options) return {};
    try {
      return JSON.parse(String(options));
    } catch (e) {
      return {};
    }
  },

  /**
   *
   * @param {object} params
   * @param {string} params.placementId The placement identifier.
   * @param {string} params.templateId The template identifier.
   * @param {string} params.requestURL The URL the ad request came from.
   * @param {number} [params.num=1] The number of ads to return. Max of 20.
   * @param {object} [params.vars] An object containing targeting, merge, and fallback vars.
   * @param {object} [params.vars.custom] Custom targeting variables.
   * @param {object} [params.vars.fallback] Fallback template merge variables.
   */
  async findFor({
    placementId,
    templateId,
    requestURL,
    num = 1,
    vars = { custom: {}, fallback: {} },
  } = {}) {
    if (!requestURL) throw new Error('No request URL was provided');
    if (!placementId) throw createError(400, 'No placement ID was provided.');
    if (!templateId) throw createError(400, 'No template ID was provided.');

    const limit = num > 0 ? parseInt(num, 10) : 1;
    if (limit > 10) throw createError(400, 'You cannot return more than 10 ads in one request.');

    /**
     * @todo
     * Determine what _actually_ needs to be queried here.
     * Keep this as small (and as fast) as possible.
     */
    const placement = await Placement.findOne({ _id: placementId }, { _id: 1 });
    if (!placement) throw createError(404, `No placement exists for ID '${placementId}'`);

    const template = await Template.findOne({ _id: templateId }, { html: 1, fallback: 1 });
    if (!template) throw createError(404, `No template exists for ID '${templateId}'`);

    /**
     * For now, merely return the number of requested ads.
     * Eventually this should use scheduling, weighting, custom variable targeting, etc.
     */
    const campaigns = await Campaign.find().limit(limit);
    this.fillWithFallbacks(campaigns, limit);

    const requestObj = new AnalyticsRequestObject({ kv: vars.custom, pid: placement.id });
    await requestObj.aggregateSave();

    const ads = campaigns.map((campaign) => {
      const ad = this.buildAdFor(campaign, template, vars.fallback);
      return this.appendTrackers(ad, requestURL, requestObj.hash);
    });

    const now = new Date();
    const request = new AnalyticsRequest({ hash: requestObj.hash, hour: now, last: now });
    await request.aggregateSave(limit); // @todo Determine if this should actually not await?
    return ads;
  },

  appendTrackers(ad, requestURL, hash) {
    const { campaignId } = ad;
    const trackers = {
      load: this.createTracker('load', campaignId, requestURL, hash),
      view: this.createTracker('view', campaignId, requestURL, hash),
    };
    return { ...ad, ...{ trackers } };
  },

  createTracker(type, campaignId, requestURL, hash) {
    const cid = campaignId || '';
    return `${requestURL}/t/${type}/${hash}.gif?cid=${cid}`;
  },

  fillWithFallbacks(campaigns, limit) {
    if (campaigns.length < limit) {
      const n = limit - campaigns.length;
      for (let i = 0; i < n; i += 1) {
        campaigns.push({ id: null });
      }
    }
  },

  buildFallbackFor(campaignId, template, fallbackVars) {
    const ad = this.createEmptyAd(campaignId);
    if (template.fallback) {
      ad.html = TemplateRepo.render(template.fallback, fallbackVars);
    }
    return ad;
  },

  createEmptyAd(campaignId) {
    return {
      campaignId: campaignId || null,
      creativeId: null,
      fallback: true,
      html: '',
    };
  },

  buildAdFor(campaign, template, fallbackVars) {
    if (!campaign.id) return this.buildFallbackFor(null, template, fallbackVars);
    const count = campaign.get('creatives.length');
    if (!count) {
      // No creative found. Send fallback.
      return this.buildFallbackFor(campaign.id, template, fallbackVars);
    }
    const ad = this.createEmptyAd(campaign.id);

    // Rotate the creative randomly. Eventually weighting could be added.
    const index = randomBetween(0, count - 1);
    const creative = campaign.get(`creatives.${index}`);

    // Render the template.
    // @todo The click tracker also needs to be added.
    ad.html = TemplateRepo.render(template.html, { campaign, creative });
    ad.creativeId = creative.id;
    ad.fallback = false;
    return ad;
  },
};
