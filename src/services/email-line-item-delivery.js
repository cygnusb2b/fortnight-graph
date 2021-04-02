const createError = require('http-errors');
const {
  Advertiser,
  Campaign,
  EmailDeployment,
  EmailLineItem,
  EmailPlacement,
  Image,
  Publisher,
  Story,
} = require('../models');
const storyUrl = require('../utils/story-url');
const dayjs = require('../dayjs');

const { isArray } = Array;

const getStartOfDay = date => new Date(Date.UTC(
  date.getFullYear(),
  date.getMonth(),
  date.getDate(),
));

module.exports = {
  /**
   *
   * @param {object} params
   * @param {string} params.placementId
   * @param {Date} params.date
   * @param {object} [params.imageOptions] Imgix options to use in the creative image url.
   * @param {object} [params.advertiserLogoOptions] Imgix options to use in the creative image url.
   */
  async findFor({
    placementId,
    date,
    imageOptions,
    advertiserLogoOptions,
  } = {}) {
    const [placement, lineItem] = await Promise.all([
      this.getPlacement({ placementId }),
      this.getLineItemFor({ placementId, date }),
    ]);
    if (!lineItem) return null;

    // find the campaign and for the line item and the deployment for the placement
    const [campaign, deployment] = await Promise.all([
      Campaign.findActiveById(lineItem.campaignId, {
        name: 1,
        advertiserId: 1,
        storyId: 1,
        url: 1,
        creatives: 1,
        createdAt: 1,
        updatedAt: 1,
      }),
      EmailDeployment.findById(placement.deploymentId, { publisherId: 1 }),
    ]);
    if (!campaign) return null;
    const [advertiser, creative] = await Promise.all([
      this.getAdvertiserFor(campaign, advertiserLogoOptions),
      this.getCreativeFor(campaign),
    ]);
    if (!creative) return null;

    await Promise.all([
      (async () => {
        if (creative.image) creative.image.src = await creative.image.getSrc(true, imageOptions);
      })(),
      (async () => {
        if (advertiser.image) {
          advertiser.image.src = await advertiser.image.getSrc(false, advertiserLogoOptions);
        }
      })(),
    ]);

    return {
      placement: {
        id: placement.id,
        name: placement.name,
        fullName: placement.fullName,
        publisherName: placement.publisherName,
        deploymentName: placement.deploymentName,
      },
      advertiser: {
        id: advertiser.id,
        name: advertiser.name,
        pushId: advertiser.pushId,
        website: advertiser.website,
        externalId: advertiser.externalId,
        image: advertiser.image ? {
          id: advertiser.image.id,
          src: advertiser.image.src,
          alt: advertiser.image.alt,
        } : {},
      },
      campaign: {
        id: campaign.id,
        name: campaign.name,
        lineItem: {
          id: lineItem.id,
          name: lineItem.name,
          createdAt: lineItem.createdAt ? lineItem.createdAt.getTime() : null,
          updatedAt: lineItem.updatedAt ? lineItem.updatedAt.getTime() : null,
        },
      },
      creative: {
        id: creative.id,
        title: creative.title,
        teaser: creative.teaser,
        href: await this.getClickUrl(campaign, deployment, creative),
        image: creative.image ? {
          id: creative.image.id,
          src: creative.image.src,
          alt: creative.image.alt,
        } : {},
      },
    };
  },

  /**
   *
   * @param {object} params
   * @param {string} params.placementId
   */
  async getPlacement({ placementId } = {}) {
    if (!placementId) throw createError(400, 'No placement ID was provided.');

    const placement = await EmailPlacement.findOne({ _id: placementId, deleted: false }, {
      _id: 1,
      name: 1,
      fullName: 1,
      publisherName: 1,
      deploymentId: 1,
      deploymentName: 1,
    });
    if (!placement) throw createError(404, `No email placement exists for ID '${placementId}'`);
    return placement;
  },

  /**
   *
   * @param {object} params
   * @param {string} params.placementId
   * @param {Date} params.date
   */
  async getLineItemFor({ placementId, date: d } = {}) {
    if (!placementId) throw createError(400, 'No placement ID was provided.');
    if (!d) throw createError(400, 'No date was provided.');
    const { $d: date } = dayjs(d).tz('UTC');

    // find the _first_ matching line item. if more than one, pick the oldest (i.e. sort by _id).
    return EmailLineItem.findOne({
      $or: [
        { 'dates.start': { $lte: date }, 'dates.end': { $gte: date } },
        { 'dates.days': getStartOfDay(date) },
      ],
      emailPlacementId: placementId,
      ready: true,
      deleted: false,
      paused: false,
    }, {
      name: 1,
      campaignId: 1,
      createdAt: 1,
      updatedAt: 1,
    }, { sort: { _id: 1 } });
  },

  /**
   *
   * @param {object} campaign
   */
  async getCreativeFor(campaign) {
    const { creatives } = campaign;
    if (!isArray(creatives) || !creatives.length) return null;

    const eligible = creatives.filter(creative => !creative.deleted && creative.active);
    // use first eligible creative.
    const [creative] = eligible;
    if (!creative) return null;

    // Append the creative's image.
    const { imageId } = creative;
    if (imageId) creative.image = await Image.findById(imageId);
    return creative;
  },

  async getClickUrl(campaign, deployment = {}, creative = {}) {
    const { storyId, url } = campaign;
    const { publisherId } = deployment;
    if (!storyId) return url;
    // Campaign is linked to a story, generate using publiser or account host.
    const publisher = await Publisher.findById(publisherId, { domainName: 1 });
    const story = await Story.findById(storyId, { body: 0 });
    return storyUrl(story, {
      pubid: publisher.id,
      utm_source: 'NativeX',
      utm_medium: 'email',
      utm_campaign: campaign.id,
      utm_term: deployment.id,
      utm_content: creative.id,
    });
  },

  async getAdvertiserFor(campaign) {
    if (!campaign || !campaign.advertiserId) return {};
    const advertiser = await Advertiser.findById(campaign.advertiserId, ['name', 'pushId', 'website', 'externalId', 'logoImageId']);
    if (!advertiser) return {};
    const { logoImageId } = advertiser;
    if (logoImageId) advertiser.image = await Image.findById(logoImageId);
    return advertiser;
  },
};
