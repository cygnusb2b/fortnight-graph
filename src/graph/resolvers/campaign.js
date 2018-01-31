const paginationResolvers = require('./pagination');
const Advertiser = require('../../models/advertiser');
const Campaign = require('../../models/campaign');
const CampaignRepo = require('../../repositories/campaign');
const Pagination = require('../../classes/pagination');

module.exports = {
  /**
   *
   */
  Campaign: {
    id: campaign => campaign.get('cid'),
    advertiser: campaign => Advertiser.findOne({ _id: campaign.get('advertiserId') }),
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
      return new Pagination(Campaign, { pagination, sort });
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
