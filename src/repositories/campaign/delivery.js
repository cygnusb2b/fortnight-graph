const createError = require('http-errors');
const Promise = require('bluebird');
const uuidv4 = require('uuid/v4');
const { isURL } = require('validator');
const jwt = require('jsonwebtoken');
const Campaign = require('../../models/campaign');
const Template = require('../../models/template');
const Placement = require('../../models/placement');
const AnalyticsEvent = require('../../models/analytics/event');
const TemplateRepo = require('../../repositories/template');
const BotDetector = require('../../services/bot-detector');
const Utils = require('../../utils');

module.exports = {
  /**
   *
   * @param {*} options
   */
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
   * @param {Date} params.startDate
   * @param {string} params.placementId
   * @param {object} params.keyValues
   * @param {number} params.limit
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
   * @param {string} params.placementId
   * @param {string} params.templateId
   * @return {Promise}
   */
  async getPlacementAndTemplate({ placementId, templateId } = {}) {
    if (!placementId) throw createError(400, 'No placement ID was provided.');
    if (!templateId) throw createError(400, 'No template ID was provided.');

    const placement = await Placement.findOne({ _id: placementId }, { _id: 1 });
    if (!placement) throw createError(404, `No placement exists for ID '${placementId}'`);

    const template = await Template.findOne({ _id: templateId }, { html: 1, fallback: 1 });
    if (!template) throw createError(404, `No template exists for ID '${templateId}'`);

    return { placement, template };
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
    ipAddress,
    num = 1,
    vars = { custom: {}, fallback: {} },
  } = {}) {
    if (!requestURL) throw new Error('No request URL was provided');
    const { placement, template } = await this.getPlacementAndTemplate({ placementId, templateId });

    const limit = num > 0 ? parseInt(num, 10) : 1;
    if (limit > 10) throw createError(400, 'You cannot return more than 10 ads in one request.');
    if (limit > 1) throw createError(501, 'Requesting more than one ad in a request is not yet implemented.');

    const campaigns = await this.queryCampaigns({
      startDate: new Date(),
      placementId: placement.id,
      keyValues: vars.custom,
      limit,
    });
    this.fillWithFallbacks(campaigns, limit);

    const ads = [];
    const events = [];
    campaigns.forEach((campaign) => {
      const event = this.createRequestEvent({
        cid: campaign.id,
        pid: placement.id,
        ua: userAgent,
        kv: vars.custom,
        ip: ipAddress,
      });
      events.push(event);
      const ad = this.buildAdFor({
        campaign,
        template,
        fallbackVars: vars.fallback,
        requestURL,
        event,
      });
      ads.push(ad);
    });
    await Promise.all(events.map(event => event.save()));
    return ads;
  },

  createRequestEvent({
    cid,
    pid,
    ua,
    kv,
    ip,
  }) {
    const bot = BotDetector.detect(ua);
    return new AnalyticsEvent({
      e: 'request',
      uuid: uuidv4(),
      cid: cid || undefined,
      pid,
      d: new Date(),
      bot,
      ua,
      kv,
      ip,
    });
  },

  fillWithFallbacks(campaigns, limit) {
    if (campaigns.length < limit) {
      const n = limit - campaigns.length;
      for (let i = 0; i < n; i += 1) {
        campaigns.push({ id: null });
      }
    }
  },

  createEmptyAd(campaignId) {
    return {
      campaignId: campaignId || null,
      creativeId: null,
      fallback: true,
      html: '',
    };
  },

  createTrackers(requestURL, event) {
    return {
      load: this.createTracker('load', requestURL, event),
      view: this.createTracker('view', requestURL, event),
    };
  },

  createTracker(type, requestURL, event) {
    const secret = process.env.TRACKER_SECRET;
    const { uuid, pid, cid } = event;
    const payload = { uuid, pid, cid };
    const token = jwt.sign(payload, secret, { noTimestamp: true });
    return `${requestURL}/e/${token}/${type}.gif`;
  },

  createImgBeacon(trackers) {
    return `<div data-fortnight-type="placement"><img data-fortnight-view="pending" data-fortnight-beacon="${trackers.view}" src="${trackers.load}"></div>`;
  },

  createCampaignRedirect(requestURL, event) {
    const { uuid, pid, cid } = event;
    const secret = process.env.TRACKER_SECRET;
    const payload = { uuid, pid, cid };
    const token = jwt.sign(payload, secret, { noTimestamp: true });
    return `${requestURL}/redir/${token}`;
  },

  createFallbackRedirect(url, requestURL, event) {
    // @todo This should somehow notify that there's a problem with the URL.
    if (!isURL(String(url), { require_protocol: true })) return url;

    const { uuid, pid, cid } = event;
    const secret = process.env.TRACKER_SECRET;
    const payload = {
      uuid,
      pid,
      cid,
      url,
    };
    const token = jwt.sign(payload, secret, { noTimestamp: true });
    return `${requestURL}/redir/${token}`;
  },

  buildFallbackFor({
    template,
    fallbackVars,
    requestURL,
    event,
  }) {
    const { cid } = event;
    const ad = this.createEmptyAd(cid);
    const trackers = this.createTrackers(requestURL, event);
    const beacon = this.createImgBeacon(trackers);

    if (template.fallback) {
      let vars = {};
      if (fallbackVars) {
        const url = this.createFallbackRedirect(fallbackVars.url, requestURL, event);
        vars = Object.assign({}, fallbackVars, { url });
      }
      vars.beacon = beacon;
      ad.html = TemplateRepo.render(template.fallback, vars);
    } else {
      ad.html = beacon;
    }
    return ad;
  },

  buildAdFor({
    campaign,
    template,
    fallbackVars,
    requestURL,
    event,
  }) {
    if (!campaign.id) {
      return this.buildFallbackFor({
        template,
        fallbackVars,
        requestURL,
        event,
      });
    }
    const count = campaign.get('creatives.length');
    if (!count) {
      // No creative found. Send fallback.
      return this.buildFallbackFor({
        template,
        fallbackVars,
        requestURL,
        event,
      });
    }
    const ad = this.createEmptyAd(campaign.id);

    // Rotate the creative randomly. Eventually weighting could be added.
    const index = Utils.randomBetween(0, count - 1);
    const creative = campaign.get(`creatives.${index}`);

    // Render the template.
    const href = this.createCampaignRedirect(requestURL, event);
    const trackers = this.createTrackers(requestURL, event);
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
