const { paginationResolvers } = require('@limit0/mongoose-graphql-pagination');
const AdvertiserRepo = require('../../repositories/advertiser');
const PlacementRepo = require('../../repositories/placement');
const CampaignRepo = require('../../repositories/campaign');
const CreativeRepo = require('../../repositories/campaign/creative');
const CriteriaRepo = require('../../repositories/campaign/criteria');
const ContactRepo = require('../../repositories/contact');
const Campaign = require('../../models/campaign');
const Story = require('../../models/story');
const Image = require('../../models/image');
const contactNotifier = require('../../services/contact-notifier');

const getNotifyDefaults = async (advertiserId, user) => {
  const advertiser = await AdvertiserRepo.findById(advertiserId);
  const notify = {
    internal: await advertiser.get('notify.internal'),
    external: await advertiser.get('notify.external'),
  };
  const contact = await ContactRepo.getOrCreateFor(user);
  notify.internal.push(contact.id);
  return notify;
};

module.exports = {
  /**
   *
   */
  Campaign: {
    advertiser: campaign => AdvertiserRepo.findById(campaign.get('advertiserId')),
    notify: async (campaign) => {
      const internal = await ContactRepo.find({ _id: { $in: campaign.notify.internal } });
      const external = await ContactRepo.find({ _id: { $in: campaign.notify.external } });
      return { internal, external };
    },
    hash: campaign => campaign.pushId,
    story: campaign => Story.findById(campaign.storyId),
  },

  CampaignCriteria: {
    placements: criteria => PlacementRepo.find({ _id: criteria.get('placementIds') }),
  },

  CampaignCreative: {
    image: creative => Image.findById(creative.imageId),
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
    campaign: async (root, { input }, { auth }) => {
      auth.check();
      const { id } = input;
      const record = await CampaignRepo.findById(id);
      if (!record) throw new Error(`No campaign record found for ID ${id}.`);
      return record;
    },

    /**
     *
     */
    campaignCreative: (root, { input }, { auth }) => {
      const { campaignId, creativeId } = input;
      auth.checkCampaignAccess(campaignId);
      return CreativeRepo.findFor(campaignId, creativeId);
    },

    /**
     *
     */
    campaignHash: async (root, { input }) => {
      const { advertiserId, hash } = input;
      const record = await Campaign.findOne({ advertiserId, pushId: hash });
      if (!record) throw new Error(`No advertiser campaign record found for hash ${hash}.`);
      return record;
    },

    /**
     *
     */
    allCampaigns: (root, { pagination, sort }, { auth }) => {
      auth.check();
      return CampaignRepo.paginate({ pagination, sort });
    },

    /**
     *
     */
    searchCampaigns: (root, { pagination, phrase }, { auth }) => {
      auth.check();
      return CampaignRepo.search(phrase, { pagination });
    },
  },

  /**
   *
   */
  Mutation: {
    /**
     *
     */
    createCampaign: async (root, { input }, { auth }) => {
      auth.check();
      const { payload } = input;
      payload.criteria = { start: payload.startDate };
      payload.notify = await getNotifyDefaults(payload.advertiserId, auth.user);
      const campaign = await CampaignRepo.create(payload);
      contactNotifier.sendInternalCampaignCreated({ campaign });
      contactNotifier.sendExternalCampaignCreated({ campaign });
      return campaign;
    },

    createExternalUrlCampaign: async (root, { input }, { auth }) => {
      auth.check();
      const { name, advertiserId, startDate } = input;
      const notify = await getNotifyDefaults(advertiserId, auth.user);

      const campaign = await Campaign.create({
        name,
        advertiserId,
        criteria: { start: startDate },
        notify,
      });

      contactNotifier.sendInternalCampaignCreated({ campaign });
      contactNotifier.sendExternalCampaignCreated({ campaign });
      return campaign;
    },

    createExistingStoryCampaign: async (root, { input }, { auth }) => {
      auth.check();
      const { name, storyId, startDate } = input;
      const story = await Story.findById(storyId, { _id: 1, advertiserId: 1 });
      if (!story) throw new Error(`No story found for ID '${storyId}'`);

      const { advertiserId } = story;
      const notify = await getNotifyDefaults(advertiserId, auth.user);

      const campaign = await Campaign.create({
        name,
        advertiserId,
        criteria: { start: startDate },
        notify,
      });

      contactNotifier.sendInternalCampaignCreated({ campaign });
      contactNotifier.sendExternalCampaignCreated({ campaign });
      return campaign;
    },

    createNewStoryCampaign: async (root, { input }, { auth }) => {
      auth.check();
      const { user } = auth;
      const { name, advertiserId, startDate } = input;
      const notify = await getNotifyDefaults(advertiserId, auth.user);

      const story = await Story.create({
        title: 'Placeholder Story',
        advertiserId,
        disposition: 'Placeholder',
        updatedById: user.id,
        createdById: user.id,
      });

      const campaign = await Campaign.create({
        name,
        storyId: story.id,
        advertiserId,
        criteria: { start: startDate },
        notify,
      });

      contactNotifier.sendInternalCampaignCreated({ campaign });
      contactNotifier.sendExternalCampaignCreated({ campaign });
      return campaign;
    },

    /**
     *
     */
    updateCampaign: (root, { input }, { auth }) => {
      auth.check();
      const { id, payload } = input;
      return CampaignRepo.update(id, payload);
    },

    assignCampaignValue: async (root, { input }) => {
      const { id, field, value } = input;
      const campaign = await Campaign.findById(id);
      if (!campaign) throw new Error(`Unable to assign field '${field}' to campaign: no record found for id '${id}'`);
      campaign.set(field, value);
      return campaign.save();
    },

    /**
     *
     */
    campaignCriteria: async (root, { input }, { auth }) => {
      auth.check();
      const { campaignId, payload } = input;
      return CriteriaRepo.setFor(campaignId, payload);
    },

    campaignUrl: async (root, { input }, { auth }) => {
      const { campaignId, url } = input;
      auth.checkCampaignAccess(campaignId);
      const campaign = await Campaign.findById(campaignId);
      if (!campaign) throw new Error(`Unable to set campaign URL: no campaign found for '${campaignId}'`);
      campaign.url = url;
      return campaign.save();
    },

    /**
     *
     */
    addCampaignCreative: (root, { input }, { auth }) => {
      const { campaignId, payload } = input;
      auth.checkCampaignAccess(campaignId);
      return CreativeRepo.createFor(campaignId, payload);
    },

    /**
     *
     */
    removeCampaignCreative: async (root, { input }, { auth }) => {
      const { campaignId, creativeId } = input;
      auth.checkCampaignAccess(campaignId);
      await CreativeRepo.removeFrom(campaignId, creativeId);
      return 'ok';
    },

    /**
     *
     */
    campaignCreativeStatus: async (root, { input }, { auth }) => {
      auth.check();
      const { campaignId, creativeId, status } = input;
      return CreativeRepo.setStatusFor(campaignId, creativeId, status);
    },

    /**
     *
     */
    campaignCreativeDetails: async (root, { input }, { auth }) => {
      const { campaignId, creativeId, payload } = input;
      auth.checkCampaignAccess(campaignId);
      const { title, teaser, status } = payload;
      return CreativeRepo.updateDetailsFor(campaignId, creativeId, { title, teaser, status });
    },

    /**
     *
     */
    campaignCreativeImage: async (root, { input }, { auth }) => {
      const { campaignId, creativeId, imageId } = input;
      auth.checkCampaignAccess(campaignId);
      return CreativeRepo.updateImageFor(campaignId, creativeId, imageId);
    },

    /**
     *
     */
    campaignContacts: (root, { input }, { auth }) => {
      auth.check();
      const { id, type, contactIds } = input;
      return ContactRepo.setContactsFor(Campaign, id, type, contactIds);
    },
  },
};
