const createError = require('http-errors');
const uuid = require('uuid/v4');
const { isURL } = require('validator');
const jwt = require('jsonwebtoken');
const BotDetector = require('../../services/bot-detector');
const Placement = require('../../models/placement');
const Template = require('../../models/template');
const AnalyticsRequest = require('../../models/analytics/request');
const AnalyticsBot = require('../../models/analytics/bot');
const AnalyticsRequestObject = require('../../models/analytics/request-object');
const TemplateRepo = require('../../repositories/template');
const Campaign = require('../../models/campaign');
const Utils = require('../../utils');

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
   * Queries for campaigns.
   *
   * @param {object} params
   * @return {Promise}
   */
  queryCampaigns({
    startDate,
    placementId,
    keyValues,
    limit,
  }) {
    const criteria = {
      status: 'Active',
      'criteria.start': { $lte: startDate },
      'criteria.placementIds': placementId,
      $and: [
        {
          $or: [
            { 'criteria.end': { $exists: false } },
            { 'criteria.end': { $gt: startDate } },
          ],
        },
      ],
    };

    const kvs = Utils.cleanValues(keyValues);
    Object.keys(kvs).forEach((key) => {
      criteria.$and.push({
        'criteria.kvs': { $elemMatch: { key, value: kvs[key] } },
      });
    });
    return Campaign.find(criteria).limit(limit);
  },

  /**
   *
   * @param {object} params
   * @param {string} params.placementId The placement identifier.
   * @param {string} params.templateId The template identifier.
   * @param {string} params.requestURL The URL the ad request came from.
   * @param {string} params.userAgent The requesting user agent.
   * @param {number} [params.num=1] The number of ads to return. Max of 20.
   * @param {object} [params.vars] An object containing targeting, merge, and fallback vars.
   * @param {object} [params.vars.custom] Custom targeting variables.
   * @param {object} [params.vars.fallback] Fallback template merge variables.
   */
  async findFor({
    placementId,
    templateId,
    requestURL,
    userAgent,
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
    const now = new Date();
    const requestObj = new AnalyticsRequestObject({ kv: vars.custom, pid: placement.id });
    await requestObj.aggregateSave();

    const campaigns = await this.queryCampaigns({
      startDate: now,
      placementId: placement.id,
      keyValues: vars.custom,
      limit,
    });

    this.fillWithFallbacks(campaigns, limit);

    const { hash } = requestObj;
    const ads = campaigns.map(campaign => this.buildAdFor(
      campaign,
      template,
      vars.fallback,
      requestURL,
      hash,
    ));

    const bot = BotDetector.detect(userAgent);
    const doc = bot.detected ? new AnalyticsBot({
      hash,
      last: now,
      value: bot.value,
      e: 'request',
    }) : new AnalyticsRequest({ hash, last: now });
    // @todo Once limit is larger than 1, the bot model will need to support multiple increments.
    await doc.aggregateSave(limit); // @todo Determine if this should actually not await?
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

  createTrackers(campaignId, requestURL, hash) {
    return {
      load: this.createTracker('load', campaignId, requestURL, hash),
      view: this.createTracker('view', campaignId, requestURL, hash),
    };
  },

  /**
   *
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
    const token = jwt.sign(payload, secret);
    return `${requestURL}/t/${token}/${type}.gif`;
  },

  createImgBeacon(trackers) {
    return `<div data-fortnight-type="placement"><img data-fortnight-view="pending" data-fortnight-beacon="${trackers.view}" src="${trackers.load}"></div>`;
  },

  createTrackedHTML(ad) {
    const { trackers } = ad;
    return `${ad.html}\n${this.createImgBeacon(trackers)}`;
  },

  createCampaignRedirect(campaignId, requestURL, hash, noTimestamp = true) {
    const secret = process.env.TRACKER_SECRET;
    const payload = {
      hash,
      cid: campaignId,
    };
    const token = jwt.sign(payload, secret, { noTimestamp });
    return `${requestURL}/go/${token}`;
  },

  createFallbackRedirect(url, requestURL, hash, noTimestamp = true) {
    // @todo This should somehow notify that there's a problem with the URL.
    if (!isURL(String(url), { require_protocol: true })) return url;
    const secret = process.env.TRACKER_SECRET;
    const payload = { hash, url };
    const token = jwt.sign(payload, secret, { noTimestamp });
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
    const trackers = this.createTrackers(null, requestURL, hash);
    const beacon = this.createImgBeacon(trackers);

    if (template.fallback) {
      let vars = {};
      if (fallbackVars) {
        const url = this.createFallbackRedirect(fallbackVars.url, requestURL, hash);
        vars = Object.assign({}, fallbackVars, { url });
      }
      vars.beacon = beacon;
      ad.html = TemplateRepo.render(template.fallback, vars);
    } else {
      ad.html = beacon;
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
    const index = Utils.randomBetween(0, count - 1);
    const creative = campaign.get(`creatives.${index}`);

    // Render the template.
    const href = this.createCampaignRedirect(campaign.id, requestURL, hash);
    const trackers = this.createTrackers(requestURL, hash);
    const beacon = this.createImgBeacon(trackers);

    const vars = {
      beacon,
      href,
      campaign,
      creative,
    };
    ad.html = TemplateRepo.render(template.html, vars);
    ad.creativeId = creative.id;
    ad.fallback = false;
    return ad;
  },
};
