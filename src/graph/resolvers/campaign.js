const paginationResolvers = require('./pagination');
const AdvertiserRepo = require('../../repositories/advertiser');
const PlacementRepo = require('../../repositories/placement');
const CampaignRepo = require('../../repositories/campaign');
const CreativeRepo = require('../../repositories/campaign/creative');
const CriteriaRepo = require('../../repositories/campaign/criteria');

module.exports = {
  /**
   *
   */
  Campaign: {
    advertiser: campaign => AdvertiserRepo.findById(campaign.get('advertiserId')),
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
    removeCampaignCreative: async (root, { input }, { auth }) => {
      auth.check();
      const { campaignId, creativeId } = input;
      await CreativeRepo.removeFrom(campaignId, creativeId);
      return 'ok';
    },

    /**
     *
     */
    addCampaignCriteria: (root, { input }, { auth }) => {
      auth.check();
      const { campaignId, payload } = input;
      return CriteriaRepo.createFor(campaignId, payload);
    },

    /**
     *
     */
    updateCampaignCriteria: async (root, { input }, { auth }) => {
      auth.check();
      const { campaignId, payload } = input;
      return CriteriaRepo.updateFor(campaignId, payload);
    },

    /**
     *
     */
    removeCampaignCriteria: async (root, { input }, { auth }) => {
      auth.check();
      const { campaignId } = input;
      await CriteriaRepo.removeFrom(campaignId);
      return 'ok';
    },
  },
};
