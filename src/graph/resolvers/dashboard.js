const AnalyticsCampaign = require('../../models/analytics/campaign');
const AnalyticsPlacement = require('../../models/analytics/placement');
const Campaign = require('../../models/campaign');
const Publisher = require('../../models/publisher');
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

    /**
     *
     */
    publisherMetricBreakouts: async (root, { input, sort }, { auth }) => {
      auth.check();
      const { startDay, endDay } = input;

      const pipeline = [
        { $project: { _id: 1, name: 1 } },
        {
          $lookup: {
            from: 'analytics-placements',
            let: { publisherId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$pubid', '$$publisherId'] },
                      { $gte: ['$day', startDay] },
                      { $lte: ['$day', endDay] },
                    ],
                  },
                },
              },
              {
                $group: {
                  _id: '$pubid',
                  views: { $sum: '$view' },
                  clicks: { $sum: '$click' },
                },
              },
            ],
            as: 'metrics',
          },
        },
        {
          $unwind: {
            path: '$metrics',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            _id: 1,
            publisherName: '$name',
            views: { $ifNull: ['$metrics.views', 0] },
            clicks: { $ifNull: ['$metrics.clicks', 0] },
            ctr: {
              $cond: {
                if: { $lt: ['$metrics.views', 1] },
                then: 0,
                else: { $divide: ['$metrics.clicks', '$metrics.views'] },
              },
            },
          },
        },
        { $sort: { [sort.field]: sort.order } },
      ];

      return Publisher.aggregate(pipeline);
    },

    /**
     *
     */
    topicMetricBreakouts: async (root, { input, sort }, { auth }) => {
      auth.check();
      const { startDay, endDay } = input;

      const pipeline = [
        { $project: { _id: 1, name: 1 } },
        {
          $lookup: {
            from: 'topics',
            let: { publisherId: '$_id' },
            pipeline: [
              { $match: { $expr: { $eq: ['$publisherId', '$$publisherId'] } } },
              { $project: { _id: 1, name: 1 } },
            ],
            as: 'topic',
          },
        },
        {
          $project: {
            _id: 1,
            name: 1,
            topic: {
              $cond: {
                if: { $gt: [{ $size: '$topic' }, 0] },
                then: { $concatArrays: [[{ _id: false, name: '' }], '$topic'] },
                else: [{ _id: false, name: '' }],
              },
            },
          },
        },
        { $unwind: '$topic' },
        {
          $lookup: {
            from: 'analytics-placements',
            let: { publisherId: '$_id', topicId: '$topic._id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$pubid', '$$publisherId'] },
                      { $eq: [{ $ifNull: ['$tid', false] }, '$$topicId'] },
                      { $gte: ['$day', startDay] },
                      { $lte: ['$day', endDay] },
                    ],
                  },
                },
              },
              {
                $group: {
                  _id: { pubid: '$pubid', tid: '$tid' },
                  views: { $sum: '$view' },
                  clicks: { $sum: '$click' },
                },
              },
            ],
            as: 'metrics',
          },
        },
        {
          $unwind: {
            path: '$metrics',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            publisherId: '$_id',
            publisherName: '$name',
            topicId: '$topic._id',
            topicName: '$topic.name',
            views: { $ifNull: ['$metrics.views', 0] },
            clicks: { $ifNull: ['$metrics.clicks', 0] },
            ctr: {
              $cond: {
                if: { $lt: ['$metrics.views', 1] },
                then: 0,
                else: { $divide: ['$metrics.clicks', '$metrics.views'] },
              },
            },
          },
        },
        { $sort: { [sort.field]: sort.order } },
      ];

      return Publisher.aggregate(pipeline);
    },
  },
};
