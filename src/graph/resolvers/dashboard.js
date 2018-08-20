const AnalyticsCampaign = require('../../models/analytics/campaign');
const AnalyticsPlacement = require('../../models/analytics/placement');
const Campaign = require('../../models/campaign');
const campaignDelivery = require('../../services/campaign-delivery');

module.exports = {
  /**
   *
   */
  Query: {
    /**
     *
     */
    dailyCampaignMetrics: async (root, { day }, { auth }) => {
      auth.check();
      const defaultResult = {
        campaigns: 0,
        views: 0,
        clicks: 0,
        ctr: 0,
      };

      const campaignCriteria = campaignDelivery.getDefaultCampaignCriteria();
      delete campaignCriteria.paused;
      const campaigns = await Campaign.find(campaignCriteria, { _id: 1 });
      if (!campaigns.length) return defaultResult;

      const pipeline = [];
      pipeline.push({ $match: { day } });
      pipeline.push({
        $group: {
          _id: null,
          campaigns: { $push: '$cid' },
          views: { $sum: '$view' },
          clicks: { $sum: '$click' },
        },
      });
      pipeline.push({
        $project: {
          _id: 0,
          campaigns: { $size: '$campaigns' },
          views: 1,
          clicks: 1,
          ctr: {
            $cond: {
              if: {
                $eq: ['$views', 0],
              },
              then: 0,
              else: {
                $divide: ['$clicks', '$views'],
              },
            },
          },
        },
      });

      const result = await AnalyticsCampaign.aggregate(pipeline);
      const data = result[0] ? result[0] : defaultResult;
      if (data.campaigns < campaigns.length) data.campaigns = campaigns.length;
      return data;
    },

    /**
     *
     */
    dailyTotalMetrics: async (root, { day }, { auth }) => {
      auth.check();

      const pipeline = [];
      pipeline.push({ $match: { day } });
      pipeline.push({
        $group: {
          _id: null,
          placements: { $push: '$_id' },
          views: { $sum: '$view' },
          clicks: { $sum: '$click' },
        },
      });
      pipeline.push({
        $project: {
          _id: 0,
          placements: { $size: '$placements' },
          views: 1,
          clicks: 1,
          ctr: {
            $cond: {
              if: {
                $eq: ['$views', 0],
              },
              then: 0,
              else: {
                $divide: ['$clicks', '$views'],
              },
            },
          },
        },
      });

      const result = await AnalyticsPlacement.aggregate(pipeline);
      return result[0] ? result[0] : {
        placements: 0,
        views: 0,
        clicks: 0,
        ctr: 0,
      };
    },
  },
};
