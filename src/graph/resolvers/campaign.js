const paginationResolvers = require('./pagination');
const AdvertiserRepo = require('../../repositories/advertiser');
const CampaignRepo = require('../../repositories/campaign');
const CreativeRepo = require('../../repositories/campaign/creative');

module.exports = {
  /**
   *
   */
  Campaign: {
    advertiser: campaign => AdvertiserRepo.findById(campaign.get('advertiserId')),
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
    campaign: (root, { input }, { auth }) => {
      auth.check();
      const { id } = input;
      return CampaignRepo.findById(id);
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
      return CampaignRepo.create(input);
    },

    /**
     *
     */
    updateCampaign: (root, { input }, { auth }) => {
      auth.check();
      return CampaignRepo.update(input);
    },

    /**
     *
     */
    addCampaignCreative: async (root, { input }, { auth }) => {
      auth.check();
      const { campaignId, payload } = input;
      return CreativeRepo.createFor(campaignId, payload);
    },

    /**
     *
     */
    // updateCampaignCreative: async (root, args, { auth }) => {
    //   auth.check();
    //   return CampaignRepo.updateCreative(args);
    // },

    /**
     *
     */
    removeCampaignCreative: async (root, { input }, { auth }) => {
      auth.check();
      const { campaignId, creativeId } = input;
      return CreativeRepo.removeFrom(campaignId, creativeId);
    },
  },
};
