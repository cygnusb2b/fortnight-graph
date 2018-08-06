const moment = require('moment');
const AnalyticsEvent = require('../../models/analytics/event');

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
      const end = moment(day).add(24, 'hours').toDate();

      const pipeline = [];
      pipeline.push({
        $match: {
          e: { $in: ['view-js', 'click-js'] },
          cid: { $exists: true },
          d: { $gte: day, $lt: end },
        },
      });
      pipeline.push({
        $project: {
          cid: 1,
          view: { $cond: [{ $eq: ['$e', 'view-js'] }, 1, 0] },
          click: { $cond: [{ $eq: ['$e', 'click-js'] }, 1, 0] },
        },
      });
      pipeline.push({
        $group: {
          _id: '$cid',
          views: { $sum: '$view' },
          clicks: { $sum: '$click' },
        },
      });
      pipeline.push({
        $group: {
          _id: null,
          campaigns: { $push: '$_id' },
          views: { $sum: '$views' },
          clicks: { $sum: '$clicks' },
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

      const result = await AnalyticsEvent.aggregate(pipeline);
      return result[0] ? result[0] : {
        campaigns: 0,
        views: 0,
        clicks: 0,
        ctr: 0,
      };
    },
  },
};
