const ReportingService = require('../../services/reporting');

module.exports = {
  /**
   *
   */
  Query: {
    /**
     *
     */
    reportCampaignSummary: async (root, { input }) => {
      const { hash } = input;
      return ReportingService.campaignSummary(hash);
    },

    /**
     *
     */
    reportCampaignCreativeBreakdown: async (root, { input }) => {
      const { hash } = input;
      return ReportingService.campaignCreativeBreakdown(hash);
    },
  },
};
