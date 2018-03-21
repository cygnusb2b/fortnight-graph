const paginationResolvers = require('./pagination');
const AdvertiserRepo = require('../../repositories/advertiser');
const PlacementRepo = require('../../repositories/placement');
const CampaignRepo = require('../../repositories/campaign');
const ClientRepo = require('../../repositories/campaign/client');
const CreativeRepo = require('../../repositories/campaign/creative');
const CriteriaRepo = require('../../repositories/campaign/criteria');
const ContactRepo = require('../../repositories/contact');
const Campaign = require('../../models/campaign');

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
  },

  CampaignCriteria: {
    placements: criteria => PlacementRepo.find({ _id: criteria.get('placementIds') }),
  },

  /**
   *
   */
  CampaignConnection: paginationResolvers.connection,

  /**
   *
   */
  CampaignEdge: paginationResolvers.edge,

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
    campaignHash: async (root, { input }) => {
      const { hash } = input;
      const record = await ClientRepo.findByHash(hash);
      if (!record) throw new Error(`No campaign record found for hash ${hash}.`);
      return record;
    },

    /**
     *
     */
    allCampaigns: (root, { pagination, sort }, { auth }) => {
      auth.check();
      return CampaignRepo.paginate({ pagination, sort });
    },
  },

  /**
   *
   */
  Mutation: {
    /**
     *
     */
    createCampaign: (root, { input }, { auth }) => {
      auth.check();
      const { payload } = input;
      return CampaignRepo.create(payload);
    },

    /**
     *
     */
    updateCampaign: (root, { input }, { auth }) => {
      auth.check();
      const { id, payload } = input;
      return CampaignRepo.update(id, payload);
    },

    /**
     *
     */
    addCampaignCreative: (root, { input }, { auth }) => {
      auth.check();
      const { campaignId, payload } = input;
      return CreativeRepo.createFor(campaignId, payload);
    },

    /**
     *
     */
    updateCampaignCreative: async (root, { input }, { auth }) => {
      auth.check();
      const { campaignId, creativeId, payload } = input;
      return CreativeRepo.updateFor(campaignId, creativeId, payload);
    },

    /**
     *
     */
    clientUpdateCampaign: async (root, { input }) => {
      const { campaignId, payload } = input;
      return ClientRepo.updateFor(campaignId, payload);
    },

    /**
     *
     */
    clientAddCampaignCreative: (root, { input }) => {
      const { campaignId, payload } = input;
      return CreativeRepo.createFor(campaignId, payload);
    },

    /**
     *
     */
    removeCampaignCreative: async (root, { input }, { auth }) => {
      auth.check();
      const { campaignId, creativeId } = input;
      await CreativeRepo.removeFrom(campaignId, creativeId);
      return 'ok';
    },

    /**
     *
     */
    setCampaignCriteria: async (root, { input }, { auth }) => {
      auth.check();
      const { campaignId, payload } = input;
      return CriteriaRepo.setFor(campaignId, payload);
    },

    /**
     *
     */
    addCampaignContact: (root, { input }, { auth }) => {
      auth.check();
      const { id, type, contactId } = input;
      return ContactRepo.addContactTo(Campaign, id, type, contactId);
    },

    /**
     *
     */
    removeCampaignContact: (root, { input }, { auth }) => {
      auth.check();
      const { id, type, contactId } = input;
      return ContactRepo.removeContactFrom(Campaign, id, type, contactId);
    },

    /**
     *
     */
    setCampaignContacts: (root, { input }, { auth }) => {
      auth.check();
      const { id, type, contactIds } = input;
      return ContactRepo.setContactsFor(Campaign, id, type, contactIds);
    },
  },
};
