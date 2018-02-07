const CampaignRepo = require('../../repositories/campaign');
const AdvertiserRepo = require('../../repositories/advertiser');
const paginationResolvers = require('./pagination');

module.exports = {
  /**
   *
   */
  Advertiser: {
    campaigns: advertiser => CampaignRepo.findForAdvertiser(advertiser.id),
    campaignCount: advertiser => CampaignRepo.findForAdvertiser(advertiser.id).count(),
  },

  /**
   *
   */
  AdvertiserConnection: paginationResolvers.connection,

  /**
   *
   */
  AdvertiserEdge: paginationResolvers.edge,

  /**
   *
   */
  Query: {
    /**
     *
     */
    advertiser: async (root, { input }, { auth }) => {
      auth.check();
      const { id } = input;
      const record = await AdvertiserRepo.findById(id);
      if (!record) throw new Error(`No advertiser record found for ID ${id}.`);
      return record;
    },

    /**
     *
     */
    allAdvertisers: (root, { pagination, sort }, { auth }) => {
      auth.check();
      return AdvertiserRepo.paginate({ pagination, sort });
    },
  },

  /**
   *
   */
  Mutation: {
    /**
     *
     */
    createAdvertiser: (root, { input }, { auth }) => {
      auth.check();
      const { payload } = input;
      return AdvertiserRepo.create(payload);
    },

    /**
     *
     */
    updateAdvertiser: (root, { input }, { auth }) => {
      auth.check();
      const { id, payload } = input;
      return AdvertiserRepo.update(id, payload);
    },
  },
};
