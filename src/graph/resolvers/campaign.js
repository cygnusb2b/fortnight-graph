const paginationResolvers = require('./pagination');
const AdvertiserRepo = require('../../repositories/advertiser');
const CampaignRepo = require('../../repositories/campaign');

module.exports = {
  /**
   *
   */
  Campaign: {
    id: campaign => campaign.get('cid'),
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
      return CampaignRepo.addCreative(input);
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
      return CampaignRepo.removeCreative(input);
    },
  },
};
