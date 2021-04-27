const _ = require('lodash');
const { get } = require('object-path');
const createError = require('http-errors');
const uuidv4 = require('uuid/v4');
const AnalyticsEvent = require('../models/analytics/event');
const BotDetector = require('../services/bot-detector');
const Advertiser = require('../models/advertiser');
const Campaign = require('../models/campaign');
const Publisher = require('../models/publisher');
const Image = require('../models/image');
const Placement = require('../models/placement');
const Story = require('../models/story');
const Template = require('../models/template');
const Utils = require('../utils');
const storyUrl = require('../utils/story-url');
const accountService = require('./account');
const containerAttributes = require('../delivery/container-attributes');
const trackedLinkAttributes = require('../delivery/tracked-link-attributes');

const { isArray } = Array;

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

  parseLimit(num) {
    const limit = num > 0 ? parseInt(num, 10) : 1;
    if (limit > 10) throw createError(400, 'You cannot return more than 10 ads in one request.');
    return limit;
  },

  /**
   * Gets the default campaign criteria for the provided start date.
   *
   * @param {?Date} startDate
   * @returns {object}
   */
  getDefaultCampaignCriteria(startDate, endDate) {
    const now = new Date();
    const start = startDate instanceof Date ? startDate : now;
    const end = endDate instanceof Date ? endDate : now;
    return {
      deleted: false,
      ready: true,
      paused: false,
      'criteria.start': { $lte: start },
      creatives: { $elemMatch: { active: true, deleted: false } },
      $and: [
        {
          $or: [
            { 'criteria.end': { $exists: false } },
            { 'criteria.end': null },
            { 'criteria.end': { $gt: end } },
          ],
        },
      ],
    };
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
      ...this.getDefaultCampaignCriteria(startDate),
      'criteria.placementIds': placementId,
    };

    Utils.cleanValues(keyValues);
    // Temporarily disable querying by custom key/values.
    // const kvs = Utils.cleanValues(keyValues);
    // const kvsOr = [];
    // Object.keys(kvs).forEach((key) => {
    //   kvsOr.push({
    //     'criteria.kvs': { $elemMatch: { key, value: kvs[key] } },
    //   });
    // });
    // if (kvsOr.length !== 0) {
    //   criteria.$and.push({
    //     $or: kvsOr,
    //   });
    // } else {
    //   // Ensure that only ads _without_ custom key values are returned.
    //   criteria.$and.push({
    //     'criteria.kvs.0': { $exists: false },
    //   });
    // }
    const campaigns = await Campaign.find(criteria);
    return this.selectCampaigns(campaigns, limit);
  },

  /**
   * Returns the impression reserve based on the supplied placement and account settings
   *
   * @param placement The placement model
   * @param account The account model
   */
  calculateImpressionReserve({
    placement,
    account,
  }) {
    const rp = parseInt(placement.get('reservePct'), 10);
    const ap = account.get('settings.reservePct');
    return (rp !== null && !Number.isNaN(rp) ? rp : (ap || 0)) / 100;
  },

  async queryCampaignsFor({
    placement,
    account,
    limit,
    keyValues,
  }) {
    const reservePct = this.calculateImpressionReserve({ placement, account });

    const campaigns = Math.random() >= reservePct
      ? await this.queryCampaigns({
        startDate: new Date(),
        placementId: placement.id,
        keyValues,
        limit,
      }) : [];
    this.fillWithFallbacks(campaigns, limit);
    return campaigns;
  },

  /**
   * Determines the URL for the campaign.
   *
   * @param {object} campaign
   * @param {object} placement
   * @param {object} creative
   */
  async getClickUrl(campaign, placement = {}, creative = {}) {
    const { storyId, url } = campaign;
    const { publisherId } = placement;
    if (!storyId) return url;
    // Campaign is linked to a story, generate using publiser or account host.
    const publisher = await Publisher.findById(publisherId, { domainName: 1 });
    const story = await Story.findById(storyId, { body: 0 });
    return storyUrl(story, publisher, {
      pubid: publisher.id,
      utm_source: 'NativeX',
      utm_medium: 'banner',
      utm_campaign: campaign.id,
      utm_term: placement.id,
      utm_content: creative.id,
    });
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

  async getPlacement({ placementId } = {}) {
    if (!placementId) throw createError(400, 'No placement ID was provided.');

    const placement = await Placement.findOne({ _id: placementId }, {
      _id: 1,
      templateId: 1,
      publisherId: 1,
      reservePct: 1,
    });
    if (!placement) throw createError(404, `No placement exists for ID '${placementId}'`);
    return placement;
  },

  /**
   *
   * @param {object} params
   * @param {string} params.placementId
   * @return {Promise}
   */
  async getPlacementAndTemplate({ placementId } = {}) {
    const placement = await this.getPlacement({ placementId });

    const template = await Template.findOne({ _id: placement.templateId }, {
      html: 1,
      fallback: 1,
    });
    if (!template) throw createError(404, `No template exists for ID '${placement.templateId}'`);

    return { placement, template };
  },

  async elementsFor({
    placementId,
    userAgent,
    ipAddress,
    num = 1,
    vars = { custom: {}, image: {} },
  } = {}) {
    const placement = await this.getPlacement({ placementId });
    const account = await accountService.retrieve();

    const limit = this.parseLimit(num);
    const campaigns = await this.queryCampaignsFor({
      account,
      placement,
      limit,
      keyValues: vars.custom,
    });

    return Promise.all(campaigns.map((campaign) => {
      const event = this.createRequestEvent({
        cid: campaign.id,
        pid: placement.id,
        ua: userAgent,
        kv: vars.custom,
        ip: ipAddress,
      });
      return this.buildElementsFor({
        campaign,
        placement,
        event,
        vars,
      });
    }));
  },

  /**
   *
   * @param {object} params
   * @param {string} params.placementId The placement identifier.
   * @param {string} params.userAgent The requesting user agent.
   * @param {number} [params.num=1] The number of ads to return. Max of 20.
   * @param {object} [params.vars] An object containing targeting, merge, and fallback vars.
   * @param {object} [params.vars.custom] Custom targeting variables.
   * @param {object} [params.vars.fallback] Fallback template merge variables.
   */
  async findFor({
    placementId,
    userAgent,
    ipAddress,
    num = 1,
    vars = { custom: {}, fallback: {} },
  } = {}) {
    const { placement, template } = await this.getPlacementAndTemplate({ placementId });
    const account = await accountService.retrieve();

    const limit = this.parseLimit(num);
    const campaigns = await this.queryCampaignsFor({
      account,
      placement,
      limit,
      keyValues: vars.custom,
    });

    return Promise.all(campaigns.map((campaign) => {
      const event = this.createRequestEvent({
        cid: campaign.id,
        pid: placement.id,
        ua: userAgent,
        kv: vars.custom,
        ip: ipAddress,
      });
      return this.buildAdFor({
        campaign,
        placement,
        template,
        fallbackVars: vars.fallback,
        event,
      });
    }));
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

  buildFallbackFor({
    template,
    fallbackVars,
    event,
  }) {
    const {
      cid,
      pid,
      uuid,
      kv,
    } = event;
    const ad = this.createEmptyAd(cid);

    if (template.fallback) {
      const vars = Object.assign({}, Object(fallbackVars), {
        pid,
        uuid,
        kv,
      });
      ad.html = Template.render(template.fallback, vars);
    } else {
      ad.html = Template.render(Template.getFallbackFallback(), { pid, uuid, kv });
    }
    return ad;
  },

  buildHTMLAttributes({ event, campaign, creative }) {
    const {
      pid,
      uuid,
      kv,
    } = event;
    return {
      container: containerAttributes({
        pid,
        uuid,
        kv,
        campaign,
        creative,
      }),
      link: trackedLinkAttributes({
        pid,
        uuid,
        kv,
        campaign,
        creative,
      }),
    };
  },

  buildFallbackDataFor({ placement, event }) {
    return {
      placementId: placement.id,
      hasCampaign: false,
      attributes: this.buildHTMLAttributes({ event }),
    };
  },

  /**
   * Returns the advertiser for the passed campaign
   * @param {Campaign} campaign
   * @return {?Advertiser}
   */
  getAdvertiserFor(campaign) {
    if (!campaign || !campaign.advertiserId) return {};
    return Advertiser.findById(campaign.advertiserId, ['name', 'pushId', 'website', 'externalId']);
  },

  /**
   * Rotates a campaign's creatives randomly.
   * Eventually could use some sort of weighting criteria.
   *
   * @param {Campaign} campaign
   * @return {?Creative}
   */
  async getCreativeFor(campaign) {
    const creatives = campaign.get('creatives');
    if (!isArray(creatives) || !creatives.length) return null;

    // Filter out deleted or inactive creatives.
    const eligible = creatives.filter(creative => !creative.deleted && creative.active);

    // Attempt to return a single, random creative.
    if (!eligible.length) return null;
    const index = _.random(eligible.length - 1);
    const creative = eligible[index];
    if (!creative) return null;

    // Append the creative's image.
    const { imageId } = creative;
    if (imageId) creative.image = await Image.findById(imageId);
    return creative;
  },

  async buildElementsFor({
    campaign,
    placement,
    event,
    vars,
  }) {
    if (!campaign.id) {
      return this.buildFallbackDataFor({ placement, event });
    }
    const creative = await this.getCreativeFor(campaign);
    if (!creative) {
      return this.buildFallbackDataFor({ placement, event });
    }

    const { incAdv } = get(vars, 'flags', {});
    const { advertiserName } = campaign;
    const advertiser = await this.getAdvertiserFor(incAdv ? campaign : {});
    const advertiserInfo = incAdv ? { advertiser } : { advertiserName };

    if (creative.image) {
      creative.image.src = await creative.image.getSrc(true, vars.image);
    }
    const { criteria } = campaign;

    return {
      placementId: placement.id,
      hasCampaign: true,
      attributes: this.buildHTMLAttributes({ event, campaign, creative }),
      href: await this.getClickUrl(campaign, placement, creative),
      campaign: {
        id: campaign.id,
        name: campaign.name,
        ...advertiserInfo,
        createdAt: campaign.createdAt ? campaign.createdAt.getTime() : null,
        updatedAt: campaign.updatedAt ? campaign.updatedAt.getTime() : null,
        criteria: {
          start: criteria && criteria.start ? criteria.start.getTime() : null,
          end: criteria && criteria.end ? criteria.end.getTime() : null,
        },
      },
      creative: {
        id: creative.id,
        title: creative.title,
        teaser: creative.teaser,
        linkText: creative.linkText || null,
      },
      image: creative.image ? {
        id: creative.image.id,
        src: creative.image.src,
        alt: creative.image.alt,
      } : {},
    };
  },

  async buildAdFor({
    campaign,
    placement,
    template,
    fallbackVars,
    event,
  }) {
    if (!campaign.id) {
      return this.buildFallbackFor({
        template,
        fallbackVars,
        event,
      });
    }
    const creative = await this.getCreativeFor(campaign);
    if (!creative) {
      // No creative found. Send fallback.
      return this.buildFallbackFor({
        template,
        fallbackVars,
        event,
      });
    }

    const ad = this.createEmptyAd(campaign.id);

    if (creative.image) {
      creative.image.src = await creative.image.getSrc();
    }

    const { uuid, pid, kv } = event;
    const vars = {
      uuid,
      pid,
      kv,
      href: await this.getClickUrl(campaign, placement, creative),
      campaign,
      creative,
    };
    ad.html = Template.render(template.html, vars);
    ad.creativeId = creative.id;
    ad.fallback = false;
    return ad;
  },
};
