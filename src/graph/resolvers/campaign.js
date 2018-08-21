const { paginationResolvers } = require('@limit0/mongoose-graphql-pagination');
const moment = require('moment');
const Advertiser = require('../../models/advertiser');
const AnalyticsCampaign = require('../../models/analytics/campaign');
const CreativeService = require('../../services/campaign-creatives');
const Campaign = require('../../models/campaign');
const Story = require('../../models/story');
const Contact = require('../../models/contact');
const Publisher = require('../../models/publisher');
const Image = require('../../models/image');
const Placement = require('../../models/placement');
const User = require('../../models/user');
const campaignDelivery = require('../../services/campaign-delivery');
const contactNotifier = require('../../services/contact-notifier');

const getNotifyDefaults = async (advertiserId, user) => {
  const advertiser = await Advertiser.strictFindById(advertiserId);
  const internal = await advertiser.get('notify.internal');
  const external = await advertiser.get('notify.external');

  const notify = {
    internal: internal.filter(c => !c.deleted),
    external: external.filter(c => !c.deleted),
  };
  const contact = await Contact.getOrCreateFor(user);
  notify.internal.push(contact.id);
  return notify;
};

const createDateRange = (start, end) => {
  const dates = [];
  let current = start;
  while (current <= end) {
    dates.push(moment(current));
    current = moment(current).add(1, 'days');
  }
  return dates;
};

module.exports = {
  /**
   *
   */
  Campaign: {
    advertiser: campaign => Advertiser.findById(campaign.advertiserId),
    notify: async (campaign) => {
      const internal = await Contact.find({
        _id: { $in: campaign.notify.internal },
        deleted: false,
      });
      const external = await Contact.find({
        _id: { $in: campaign.notify.external },
        deleted: false,
      });
      return { internal, external };
    },
    hash: campaign => campaign.pushId,
    story: campaign => Story.findById(campaign.storyId),
    requires: campaign => campaign.getRequirements(),
    primaryImage: (campaign) => {
      const imageIds = campaign.creatives.filter(cre => cre.active).map(cre => cre.imageId);
      if (!imageIds[0]) return null;
      return Image.findById(imageIds[0]);
    },
    publishers: async (campaign, { pagination, sort }) => {
      const placementIds = campaign.get('criteria.placementIds');
      const publisherIds = await Placement.distinct('publisherId', { _id: { $in: placementIds }, deleted: false });
      const criteria = { _id: { $in: publisherIds } };
      return Publisher.paginate({ pagination, criteria, sort });
    },
    metrics: async (campaign) => {
      const pipeline = [];
      pipeline.push({ $match: { cid: campaign._id } });
      pipeline.push({
        $group: {
          _id: '$cid',
          views: { $sum: '$view' },
          clicks: { $sum: '$click' },
        },
      });
      pipeline.push({
        $project: {
          _id: 0,
          views: 1,
          clicks: 1,
          ctr: {
            $cond: {
              if: {
                $eq: ['$views', 0],
              },
              then: 0,
              else: {
                $divide: ['$clicks', '$views'],
              },
            },
          },
        },
      });

      const result = await AnalyticsCampaign.aggregate(pipeline);
      return result[0] ? result[0] : {
        views: 0,
        clicks: 0,
        ctr: 0,
      };
    },
    reports: campaign => campaign,
    createdBy: campaign => User.findById(campaign.createdById),
    updatedBy: campaign => User.findById(campaign.updatedById),
  },

  /**
   *
   */
  CampaignReportByDay: {
    day: ({ day }, { format }) => moment(day).format(format),
  },

  /**
   *
   */
  CampaignReports: {
    byDay: async (campaign, { startDate, endDate }) => {
      const defaultMetrics = {
        views: 0,
        clicks: 0,
        ctr: 0,
      };

      const results = await AnalyticsCampaign.aggregate([
        {
          $match: {
            cid: campaign._id,
            day: { $gte: startDate, $lte: endDate },
          },
        },
        {
          $group: {
            _id: '$day',
            views: { $sum: '$view' },
            clicks: { $sum: '$click' },
          },
        },
        {
          $project: {
            _id: 0,
            day: '$_id',
            metrics: {
              views: '$views',
              clicks: '$clicks',
              ctr: {
                $cond: {
                  if: { $eq: ['$views', 0] },
                  then: 0,
                  else: { $divide: ['$clicks', '$views'] },
                },
              },
            },
          },
        },
        {
          $sort: { day: 1 },
        },
      ]);
      const range = createDateRange(startDate, endDate);
      const days = results.map(({ day }) => moment(day).format('YYYY-MM-DD'));

      return range.map((date) => {
        const day = moment(date).format('YYYY-MM-DD');
        const index = days.findIndex(d => d === day);
        return index !== -1 ? results[index] : { day: date.toDate(), metrics: defaultMetrics };
      });
    },
  },

  CampaignCriteria: {
    placements: criteria => Placement.find({ _id: criteria.get('placementIds') }),
  },

  CampaignCreative: {
    image: creative => Image.findById(creative.imageId),
    metrics: async (creative) => {
      const pipeline = [];
      pipeline.push({ $match: { cre: creative._id } });
      pipeline.push({
        $group: {
          _id: null,
          views: { $sum: '$view' },
          clicks: { $sum: '$click' },
        },
      });
      pipeline.push({
        $project: {
          _id: 0,
          views: 1,
          clicks: 1,
          ctr: {
            $cond: {
              if: {
                $eq: ['$views', 0],
              },
              then: 0,
              else: {
                $divide: ['$clicks', '$views'],
              },
            },
          },
        },
      });

      const result = await AnalyticsCampaign.aggregate(pipeline);
      return result[0] ? result[0] : {
        views: 0,
        clicks: 0,
        ctr: 0,
      };
    },
  },

  /**
   *
   */
  CampaignConnection: paginationResolvers.connection,

  /**
   *
   */
  Query: {
    /**
     *
     */
    campaign: (root, { input }, { auth }) => {
      auth.check();
      const { id } = input;
      return Campaign.strictFindActiveById(id);
    },

    /**
     *
     */
    campaignCreative: (root, { input }, { auth }) => {
      const { campaignId, creativeId } = input;
      auth.checkCampaignAccess(campaignId);
      return CreativeService.findFor(campaignId, creativeId);
    },

    /**
     *
     */
    campaignHash: async (root, { input }, { auth }) => {
      const { advertiserId, hash } = input;
      const campaign = await Campaign.strictFindActiveOne({ advertiserId, pushId: hash });
      auth.checkCampaignAccess(campaign.id);
      return campaign;
    },

    /**
     *
     */
    allCampaigns: (root, { pagination, sort }, { auth }) => {
      auth.check();
      const criteria = { deleted: false };
      return Campaign.paginate({ criteria, pagination, sort });
    },

    /**
     *
     */
    searchCampaigns: (root, { pagination, phrase }, { auth }) => {
      auth.check();
      const filter = { term: { deleted: false } };
      return Campaign.search(phrase, { pagination, filter });
    },

    /**
     *
     */
    runningCampaigns: (root, { pagination, sort }, { auth }) => {
      auth.check();
      const criteria = campaignDelivery.getDefaultCampaignCriteria();
      delete criteria.paused;
      return Campaign.paginate({ criteria, pagination, sort });
    },

    /**
     *
     */
    campaignsStartingSoon: (root, { pagination, sort }, { auth }) => {
      auth.check();
      const start = moment().add(7, 'days').toDate();
      const criteria = {
        deleted: false,
        'criteria.start': { $gte: new Date(), $lte: start },
      };
      return Campaign.paginate({ criteria, pagination, sort });
    },

    /**
     *
     */
    campaignsEndingSoon: (root, { pagination, sort }, { auth }) => {
      auth.check();
      const end = moment().add(7, 'days').toDate();
      const criteria = {
        deleted: false,
        ready: true,
        'criteria.end': { $gte: new Date(), $lte: end },
      };
      return Campaign.paginate({ criteria, pagination, sort });
    },

    /**
     *
     */
    incompleteCampaigns: (root, { pagination, sort }, { auth }) => {
      auth.check();
      const now = new Date();
      const criteria = {
        deleted: false,
        ready: false,
        $and: [
          {
            $or: [
              { 'criteria.end': { $exists: false } },
              { 'criteria.end': null },
              { 'criteria.end': { $gt: now } },
            ],
          },
        ],
      };
      return Campaign.paginate({ criteria, pagination, sort });
    },
  },

  /**
   *
   */
  Mutation: {
    /**
     *
     */
    deleteCampaign: async (root, { input }, { auth }) => {
      auth.check();
      const { id } = input;
      const campaign = await Campaign.strictFindActiveById(id);
      campaign.setUserContext(auth.user);
      return campaign.softDelete();
    },

    pauseCampaign: async (root, { id, paused }, { auth }) => {
      auth.check();
      const campaign = await Campaign.strictFindActiveById(id);
      campaign.setUserContext(auth.user);
      campaign.paused = paused;
      return campaign.save();
    },

    /**
     *
     */
    createExternalUrlCampaign: async (root, { input }, { auth }) => {
      auth.check();
      const { name, advertiserId } = input;
      const notify = await getNotifyDefaults(advertiserId, auth.user);

      const campaign = new Campaign({
        name,
        advertiserId,
        criteria: {},
        notify,
      });
      campaign.setUserContext(auth.user);
      await campaign.save();

      contactNotifier.sendInternalCampaignCreated({ campaign });
      contactNotifier.sendExternalCampaignCreated({ campaign });
      return campaign;
    },

    /**
     *
     */
    createExistingStoryCampaign: async (root, { input }, { auth }) => {
      auth.check();
      const { name, storyId } = input;
      const story = await Story.strictFindActiveById(storyId);

      const { advertiserId } = story;
      const notify = await getNotifyDefaults(advertiserId, auth.user);

      const campaign = new Campaign({
        name,
        advertiserId,
        storyId,
        criteria: {},
        notify,
      });
      campaign.setUserContext(auth.user);

      campaign.creatives.push({
        title: story.title ? story.title.slice(0, 75) : undefined,
        teaser: story.teaser ? story.teaser.slice(0, 255) : undefined,
        imageId: story.primaryImageId,
        active: story.title && story.teaser && story.imageId,
      });
      await campaign.save();

      contactNotifier.sendInternalCampaignCreated({ campaign });
      contactNotifier.sendExternalCampaignCreated({ campaign });
      return campaign;
    },

    /**
     *
     */
    createNewStoryCampaign: async (root, { input }, { auth }) => {
      auth.check();
      const { name, advertiserId, publisherId } = input;
      const notify = await getNotifyDefaults(advertiserId, auth.user);

      const story = new Story({
        title: 'Placeholder Story',
        advertiserId,
        publisherId,
        placeholder: true,
      });
      story.setUserContext(auth.user);
      await story.save();


      const campaign = new Campaign({
        name,
        storyId: story.id,
        advertiserId,
        criteria: {},
        notify,
      });
      campaign.setUserContext(auth.user);
      await campaign.save();

      contactNotifier.sendInternalCampaignCreated({ campaign });
      contactNotifier.sendExternalCampaignCreated({ campaign });
      return campaign;
    },

    /**
     *
     */
    updateCampaign: async (root, { input }, { auth }) => {
      auth.check();
      const { id, payload } = input;
      const campaign = await Campaign.strictFindActiveById(id);
      campaign.setUserContext(auth.user);
      campaign.set(payload);
      return campaign.save();
    },

    /**
     *
     */
    assignCampaignValue: async (root, { input }, { auth }) => {
      const { id, field, value } = input;
      const campaign = await Campaign.strictFindActiveById(id);

      if (auth.user) {
        campaign.setUserContext(auth.user);
      }
      campaign.set(field, value);
      return campaign.save();
    },

    /**
     *
     */
    campaignCriteria: async (root, { input }, { auth }) => {
      auth.check();
      const { campaignId, payload } = input;
      const campaign = await Campaign.strictFindActiveById(campaignId);
      campaign.setUserContext(auth.user);
      campaign.criteria = payload;
      await campaign.save();
      return campaign.criteria;
    },

    campaignUrl: async (root, { input }, { auth }) => {
      const { campaignId, url } = input;
      auth.checkCampaignAccess(campaignId);
      const campaign = await Campaign.strictFindActiveById(campaignId);
      campaign.setUserContext(auth.user);
      campaign.url = url;
      return campaign.save();
    },

    /**
     *
     */
    addCampaignCreative: (root, { input }, { auth }) => {
      const { campaignId, payload } = input;
      auth.checkCampaignAccess(campaignId);
      return CreativeService.createFor(campaignId, payload);
    },

    /**
     *
     */
    removeCampaignCreative: async (root, { input }, { auth }) => {
      const { campaignId, creativeId } = input;
      auth.checkCampaignAccess(campaignId);
      await CreativeService.removeFrom(campaignId, creativeId);
      return 'ok';
    },

    /**
     *
     */
    campaignCreativeStatus: async (root, { input }, { auth }) => {
      auth.check();
      const { campaignId, creativeId, active } = input;
      return CreativeService.setStatusFor(campaignId, creativeId, active);
    },

    /**
     *
     */
    campaignCreativeDetails: async (root, { input }, { auth }) => {
      const { campaignId, creativeId, payload } = input;
      auth.checkCampaignAccess(campaignId);
      const { title, teaser, active } = payload;
      return CreativeService.updateDetailsFor(campaignId, creativeId, { title, teaser, active });
    },

    /**
     *
     */
    campaignCreativeImage: async (root, { input }, { auth }) => {
      const { campaignId, creativeId, imageId } = input;
      auth.checkCampaignAccess(campaignId);
      return CreativeService.updateImageFor(campaignId, creativeId, imageId);
    },

    /**
     *
     */
    campaignContacts: async (root, { input }, { auth }) => {
      auth.check();
      const { id, type, contactIds } = input;
      const field = `notify.${type}`;
      const campaign = await Campaign.strictFindActiveById(id);
      campaign.set(field, contactIds);
      campaign.setUserContext(auth.user);
      return campaign.save();
    },

    campaignExternalContact: async (root, { input }, { auth }) => {
      const { campaignId, payload } = input;
      const { email, givenName, familyName } = payload;
      auth.checkCampaignAccess(campaignId);
      const campaign = await Campaign.strictFindActiveById(campaignId);

      const contact = await Contact.findOneAndUpdate({ email, deleted: false }, {
        $set: {
          familyName,
          givenName,
          name: `${givenName} ${familyName}`,
        },
        $setOnInsert: { email, deleted: false },
      }, {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
        runValidators: true,
      });

      if (auth.user) {
        campaign.setUserContext(auth.user);
      }
      campaign.get('notify.external').push(contact.id);
      return campaign.save();
    },

    removeCampaignExternalContact: async (root, { input }, { auth }) => {
      const { campaignId, contactId } = input;
      auth.checkCampaignAccess(campaignId);
      const campaign = await Campaign.strictFindActiveById(campaignId);

      campaign.removeExternalContactId(contactId);
      if (auth.user) {
        campaign.setUserContext(auth.user);
      }
      return campaign.save();
    },
  },
};
