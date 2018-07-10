const { paginationResolvers } = require('@limit0/mongoose-graphql-pagination');
const AdvertiserRepo = require('../../repositories/advertiser');
const PlacementRepo = require('../../repositories/placement');
const CampaignRepo = require('../../repositories/campaign');
const CreativeRepo = require('../../repositories/campaign/creative');
const CriteriaRepo = require('../../repositories/campaign/criteria');
const ContactRepo = require('../../repositories/contact');
const Campaign = require('../../models/campaign');
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

const updateNotifications = async (campaignId) => {
  contactNotifier.scheduleCampaignCreated({ campaignId });
  contactNotifier.scheduleCampaignStarted({ campaignId });
  contactNotifier.scheduleCampaignEnded({ campaignId });
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
      await updateNotifications(campaign.id);
      return campaign;
    },

    /**
     *
     */
    updateCampaign: async (root, { input }, { auth }) => {
      auth.check();
      const { id, payload } = input;
      const campaign = await CampaignRepo.update(id, payload);
      await updateNotifications(id);
      return campaign;
    },

    assignCampaignValue: async (root, { input }) => {
      const { id, field, value } = input;
      const campaign = await Campaign.findById(id);
      if (!campaign) throw new Error(`Unable to assign field '${field}' to campaign: no record found for id '${id}'`);
      campaign.set(field, value);
      await campaign.save();
      await updateNotifications(id);
      return campaign;
    },

    /**
     *
     */
    campaignCriteria: async (root, { input }, { auth }) => {
      auth.check();
      const { campaignId, payload } = input;
      const criteria = await CriteriaRepo.setFor(campaignId, payload);
      await updateNotifications(campaignId);
      return criteria;
    },

    campaignUrl: async (root, { input }, { auth }) => {
      const { campaignId, url } = input;
      auth.checkCampaignAccess(campaignId);
      const campaign = await Campaign.findById(campaignId);
      if (!campaign) throw new Error(`Unable to set campaign URL: no campaign found for '${campaignId}'`);
      campaign.url = url;
      await campaign.save();
      await updateNotifications(campaignId);
      return campaign;
    },

    /**
     *
     */
    addCampaignCreative: async (root, { input }, { auth }) => {
      const { campaignId, payload } = input;
      auth.checkCampaignAccess(campaignId);
      const creative = await CreativeRepo.createFor(campaignId, payload);
      await updateNotifications(campaignId);
      return creative;
    },

    /**
     *
     */
    removeCampaignCreative: async (root, { input }, { auth }) => {
      const { campaignId, creativeId } = input;
      auth.checkCampaignAccess(campaignId);
      await CreativeRepo.removeFrom(campaignId, creativeId);
      await updateNotifications(campaignId);
      return 'ok';
    },

    /**
     *
     */
    campaignCreativeStatus: async (root, { input }, { auth }) => {
      auth.check();
      const { campaignId, creativeId, status } = input;
      const saved = await CreativeRepo.setStatusFor(campaignId, creativeId, status);
      await updateNotifications(campaignId);
      return saved;
    },

    /**
     *
     */
    campaignCreativeDetails: async (root, { input }, { auth }) => {
      const { campaignId, creativeId, payload } = input;
      auth.checkCampaignAccess(campaignId);
      const { title, teaser, status } = payload;
      const details = await CreativeRepo.updateDetailsFor(
        campaignId,
        creativeId,
        { title, teaser, status },
      );
      await updateNotifications(campaignId);
      return details;
    },

    /**
     *
     */
    campaignCreativeImage: async (root, { input }, { auth }) => {
      const { campaignId, creativeId, imageId } = input;
      auth.checkCampaignAccess(campaignId);
      const image = await CreativeRepo.updateImageFor(campaignId, creativeId, imageId);
      await updateNotifications(campaignId);
      return image;
    },

    /**
     *
     */
    campaignContacts: async (root, { input }, { auth }) => {
      auth.check();
      const { id, type, contactIds } = input;
      const contacts = await ContactRepo.setContactsFor(Campaign, id, type, contactIds);
      await updateNotifications(id);
      return contacts;
    },
  },
};
