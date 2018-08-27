const AnalyticsCampaign = require('../../models/analytics/campaign');
const AnalyticsPlacement = require('../../models/analytics/placement');
const Campaign = require('../../models/campaign');
const Placement = require('../../models/placement');
const Publisher = require('../../models/publisher');
const Topic = require('../../models/topic');
const campaignDelivery = require('../../services/campaign-delivery');

module.exports = {
  /**
   *
   */
  PublisherBreakoutMetrics: {
    publisher: ({ pubid }) => {
      if (!pubid) return null;
      return Publisher.findById({ _id: pubid });
    },
    placement: ({ pid }) => {
      if (!pid) return null;
      return Placement.findById({ _id: pid });
    },
    topic: ({ tid }) => {
      if (!tid) return null;
      return Topic.findById({ _id: tid });
    },
  },

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
          campaigns: { $addToSet: '$cid' },
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
          placements: { $addToSet: '$_id' },
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

    publisherMetricBreakouts: async (root, { input }, { auth }) => {
      auth.check();
      const { startDay, endDay, breakout } = input;

      const $project = {
        _id: 0,
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
      };

      let groupId;
      switch (breakout) {
        case 'publisher':
          groupId = '$pubid';
          $project.pubid = '$_id';
          break;
        case 'placement':
          groupId = { pid: '$pid', tid: '$tid', pubid: '$pubid' };
          $project.pid = '$_id.pid';
          $project.tid = '$_id.tid';
          $project.pubid = '$_id.pubid';
          break;
        case 'topic':
          groupId = { tid: '$tid', pubid: '$pubid' };
          $project.tid = '$_id.tid';
          $project.pubid = '$_id.pubid';
          break;
        default:
          throw new Error(`The breakout '${breakout}' is not supported.`);
      }

      const pipeline = [];
      pipeline.push({
        $match: { day: { $gte: startDay, $lte: endDay } },
      });
      pipeline.push({
        $group: {
          _id: groupId,
          views: { $sum: '$view' },
          clicks: { $sum: '$click' },
        },
      });
      pipeline.push({ $project });

      return AnalyticsPlacement.aggregate(pipeline);
    },
  },
};
