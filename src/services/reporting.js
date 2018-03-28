const moment = require('moment');
const Campaign = require('../models/campaign');
const Analytics = require('../models/analytics/event');
const { ObjectId } = require('mongoose').Types;

const createDateRange = (start, end) => {
  const dates = [];
  let current = start;
  while (current <= end) {
    dates.push(moment(current));
    current = moment(current).add(1, 'days');
  }
  return dates;
};

const fillDayData = (date, days) => {
  const day = moment(date).format('YYYY-MM-DD');
  for (let i = 0; i < days.length; i += 1) {
    const d = days[i];
    if (d.date === day) {
      d.date = moment(day).toDate();
      return d;
    }
  }
  const views = 0;
  const clicks = 0;
  return { date: moment(day).toDate(), views, clicks };
};

module.exports = {
  async campaignSummary(hash) {
    const campaign = await Campaign.findOne({ hash });
    if (!campaign) throw new Error(`No campaign record found for hash '${hash}'`);
    const cid = campaign.get('id');
    const start = moment(campaign.get('criteria.start')).startOf('day');
    const end = campaign.get('criteria.end')
      ? moment(campaign.get('criteria.end')).endOf('day')
      : moment().endOf('day');
    const pipeline = [
      {
        $match: {
          cid: new ObjectId(cid),
          e: { $in: ['view-js', 'click-js'] },
          d: { $gte: start.toDate(), $lte: end.toDate() },
        },
      },
      {
        $project: {
          date: { $dateToString: { format: '%Y-%m-%d', date: '$d' } },
          view: { $cond: [{ $eq: ['$e', 'view-js'] }, 1, 0] },
          click: { $cond: [{ $eq: ['$e', 'click-js'] }, 1, 0] },
        },
      },
      {
        $group: {
          _id: '$date',
          views: { $sum: '$view' },
          clicks: { $sum: '$click' },
        },
      },
      {
        $sort: { date: 1 },
      },
      {
        $group: {
          _id: null,
          days: { $push: { date: '$_id', views: '$views', clicks: '$clicks' } },
          views: { $sum: '$views' },
          clicks: { $sum: '$clicks' },
        },
      },
      {
        $project: {
          _id: 0,
          days: 1,
          views: 1,
          clicks: 1,
        },
      },
    ];
    const results = await Analytics.aggregate(pipeline);
    const out = results[0];
    const dates = createDateRange(start, end);
    out.days = dates.map(d => fillDayData(d, out.days));
    return out;
  },
};
