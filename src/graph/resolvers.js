const AdRepo = require('../repositories/ad');

module.exports = {
  /**
   *
   */
  Query: {
    ping: () => 'pong',
    requestAds: (root, { input }) => {
      const { pid, limit } = input;
      return AdRepo.findFor({ pid, limit });
    },
  },
};
