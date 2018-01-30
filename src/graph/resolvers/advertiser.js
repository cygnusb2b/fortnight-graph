const Advertiser = require('../../models/advertiser');
const AdvertiserRepo = require('../../repositories/advertiser');
const Campaign = require('../../models/campaign');
const Pagination = require('../../classes/pagination');
const paginationResolvers = require('./pagination');

module.exports = {
  /**
   *
   */
  Advertiser: {
    campaigns: advertiser => Campaign.find({ advertiserId: advertiser.get('id') }),
    campaignCount: advertiser => Campaign.count({ advertiserId: advertiser.get('id') }),
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
    advertiser: (root, { input }, { auth }) => {
      auth.check();
      const { id } = input;
      return AdvertiserRepo.findById(id);
    },

    /**
     *
     */
    allAdvertisers: (root, { pagination, sort }, { auth }) => {
      auth.check();
      return new Pagination(Advertiser, { pagination, sort });
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
      return AdvertiserRepo.create(input);
    },

    /**
     *
     */
    updateAdvertiser: (root, { input }, { auth }) => {
      auth.check();
      return AdvertiserRepo.update(input);
    },
  },
};
