const createError = require('http-errors');
const uuidv4 = require('uuid/v4');
const jwt = require('jsonwebtoken');
const _ = require('lodash');
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
  async queryCampaigns({
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
            { 'criteria.end': null },
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
    const campaigns = await Campaign.find(criteria);
    return this.selectCampaigns(campaigns, limit);
  },

  /**
   * Selects the campaigns to return.
   * Shuffles the campaigns and returns the number based on the limit.
   *
   * @param {array} campaigns
   * @param {number} limit
   * @return {array}
   */
  selectCampaigns(campaigns, limit) {
    const shuffled = _.shuffle(campaigns);
    return shuffled.slice(0, limit);
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
    // Disable saving request events.
    // await Promise.all(events.map(event => event.save()));
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

  /**
   * @deprecated In favor of JS tracking.
   */
  createTrackers(requestURL, event) {
    return {
      load: this.createTracker('load', requestURL, event),
      view: this.createTracker('view', requestURL, event),
    };
  },

  /**
   * @deprecated In favor of JS tracking.
   */
  createTracker(type, requestURL, event) {
    const secret = process.env.TRACKER_SECRET;
    const { uuid, pid, cid } = event;
    const payload = { uuid, pid, cid };
    const token = jwt.sign(payload, secret, { noTimestamp: true });
    return `${requestURL}/e/${token}/${type}.gif`;
  },

  /**
   * @deprecated In favor of JS tracking.
   */
  createImgBeacon(trackers) {
    return `<div data-fortnight-type="placement"><img data-fortnight-view="pending" data-fortnight-beacon="${trackers.view}" src="${trackers.load}"></div>`;
  },

  /**
   * @deprecated Will need to be re-evaluated. Should not use tokens.
   */
  createCampaignRedirect(requestURL, event) {
    const { uuid, pid, cid } = event;
    const secret = process.env.TRACKER_SECRET;
    const payload = { uuid, pid, cid };
    const token = jwt.sign(payload, secret, { noTimestamp: true });
    return `${requestURL}/redir/${token}`;
  },

  buildFallbackFor({
    template,
    fallbackVars,
    requestURL,
    event,
  }) {
    const { cid, pid, uuid } = event;
    const ad = this.createEmptyAd(cid);
    const trackers = this.createTrackers(requestURL, event);
    const beacon = this.createImgBeacon(trackers);

    if (template.fallback) {
      const vars = Object.assign({}, Object(fallbackVars), {
        pid,
        uuid,
        beacon, // @deprecated Will be removed.
      });
      ad.html = TemplateRepo.render(template.fallback, vars);
    } else {
      ad.html = TemplateRepo.render(TemplateRepo.getFallbackFallback(true), { pid, uuid });
    }
    return ad;
  },

  /**
   * Rotates a campaign's creatives randomly.
   * Eventually could use some sort of weighting criteria.
   *
   * @param {Campaign} campaign
   * @return {?Creative}
   */
  getCreativeFor(campaign) {
    const count = campaign.get('creatives.length');
    if (!count) return null;
    const index = _.random(count - 1);
    return campaign.get(`creatives.${index}`);
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
    const creative = this.getCreativeFor(campaign);
    if (!creative) {
      // No creative found. Send fallback.
      return this.buildFallbackFor({
        template,
        fallbackVars,
        requestURL,
        event,
      });
    }

    const ad = this.createEmptyAd(campaign.id);

    /**
     * Disable creating a campaign redirect URL.
     * Eventually this should be added back for external URLs that we do not control.
     * The redirect should be used for tracking "good" bots _only_.
     * It should not be used for click analytics.
     */
    // const href = this.createCampaignRedirect(requestURL, event);
    // Render the template.
    const trackers = this.createTrackers(requestURL, event);
    const beacon = this.createImgBeacon(trackers);

    const { uuid, pid } = event;
    const vars = {
      uuid,
      pid,
      beacon, // @deprecated Will be removed.
      href: campaign.url,
      campaign,
      creative,
    };
    ad.html = TemplateRepo.render(template.html, vars);
    ad.creativeId = creative.id;
    ad.fallback = false;
    return ad;
  },
};
