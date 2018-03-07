const createError = require('http-errors');
const uuid = require('uuid/v4');
const { isURL } = require('validator');
const jwt = require('jsonwebtoken');
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
    if (limit > 1) throw createError(501, 'Requesting more than one ad in a request is not yet implemented.');

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
    const { hash } = requestObj;

    const ads = campaigns.map((campaign) => {
      const ad = this.buildAdFor(campaign, template, vars.fallback, requestURL, hash);
      return this.appendTrackers(ad, requestURL, hash);
    });

    const now = new Date();
    const request = new AnalyticsRequest({ hash: requestObj.hash, last: now });
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

  /**
   *
   * @todo These should probably be signed and embedded with the cid.
   * @param {string} type
   * @param {?string} campaignId
   * @param {string} requestURL
   * @param {string} hash
   */
  createTracker(type, campaignId, requestURL, hash) {
    const secret = process.env.TRACKER_SECRET;
    const payload = {
      id: uuid(),
      hash,
      cid: campaignId || undefined,
    };
    const token = jwt.sign(payload, secret, { expiresIn: '24h' });
    return `${requestURL}/t/${token}/${type}.gif`;
  },

  createImgBeacon(trackers) {
    return `<div data-app="fortnight" data-type="placement"><img src="${trackers.load}" data-view-src="${trackers.view}"></div>`;
  },

  createTrackedHTML(ad) {
    const { trackers } = ad;
    return `${ad.html}\n${this.createImgBeacon(trackers)}`;
  },

  createCampaignRedirect(campaignId, requestURL, hash) {
    const secret = process.env.TRACKER_SECRET;
    const payload = {
      hash,
      cid: campaignId,
    };
    const token = jwt.sign(payload, secret);
    return `${requestURL}/go/${token}`;
  },

  createFallbackRedirect(url, requestURL, hash) {
    // @todo This should somehow notify that there's a problem with the URL.
    if (!isURL(String(url), { require_protocol: true })) return url;
    const secret = process.env.TRACKER_SECRET;
    const payload = { hash, url };
    const token = jwt.sign(payload, secret);
    return `${requestURL}/go/${token}`;
  },

  fillWithFallbacks(campaigns, limit) {
    if (campaigns.length < limit) {
      const n = limit - campaigns.length;
      for (let i = 0; i < n; i += 1) {
        campaigns.push({ id: null });
      }
    }
  },

  buildFallbackFor(campaignId, template, fallbackVars, requestURL, hash) {
    const ad = this.createEmptyAd(campaignId);
    if (template.fallback) {
      let vars = {};
      if (fallbackVars) {
        const url = this.createFallbackRedirect(fallbackVars.url, requestURL, hash);
        vars = Object.assign({}, fallbackVars, { url });
      }
      ad.html = TemplateRepo.render(template.fallback, vars);
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

  buildAdFor(campaign, template, fallbackVars, requestURL, hash) {
    if (!campaign.id) return this.buildFallbackFor(null, template, fallbackVars, requestURL, hash);
    const count = campaign.get('creatives.length');
    if (!count) {
      // No creative found. Send fallback.
      return this.buildFallbackFor(campaign.id, template, fallbackVars, requestURL, hash);
    }
    const ad = this.createEmptyAd(campaign.id);

    // Rotate the creative randomly. Eventually weighting could be added.
    const index = randomBetween(0, count - 1);
    const creative = campaign.get(`creatives.${index}`);

    // Render the template.
    const href = this.createCampaignRedirect(campaign.id, requestURL, hash);
    ad.html = TemplateRepo.render(template.html, { href, campaign, creative });
    ad.creativeId = creative.id;
    ad.fallback = false;
    return ad;
  },
};
