const AdRepo = require('../repositories/ad');

module.exports = {
  /**
   *
   */
  Query: {
    ping: () => 'pong',
    requestAds: async (root, { input }) => {
      const { pid, limit } = input;
      const ads = AdRepo.findFor({ pid, limit });
      return ads;
    },
  },
};
