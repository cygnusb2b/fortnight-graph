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
  const ctr = 0;
  return {
    date: moment(day).toDate(),
    views,
    clicks,
    ctr,
  };
};
const getCtrProject = () => ({
  $divide: [{ $floor: { $multiply: [10000, { $divide: ['$clicks', '$views'] }] } }, 100],
});

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
        $project: {
          date: '$_id',
          views: '$views',
          clicks: '$clicks',
          ctr: getCtrProject(),
        },
      },
      {
        $group: {
          _id: null,
          days: {
            $push: {
              date: '$date',
              views: '$views',
              clicks: '$clicks',
              ctr: '$ctr',
            },
          },
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
          ctr: getCtrProject(),
        },
      },
    ];
    const results = await Analytics.aggregate(pipeline);
    const out = results[0];
    const dates = createDateRange(start, end);
    out.days = dates.map(d => fillDayData(d, out.days));
    return out;
  },
  async campaignCreativeBreakdown(hash) {
    const campaign = await Campaign.findOne({ hash });
    if (!campaign) throw new Error(`No campaign record found for hash '${hash}'`);
    const cid = campaign.get('id');
    const creatives = campaign.get('creatives');
    const creativeIds = [];
    const creativesById = [];
    creatives.forEach((creative) => {
      creativeIds.push(creative._id);
      creativesById[creative._id] = creative;
    });
    const start = moment(campaign.get('criteria.start')).startOf('day');
    const end = campaign.get('criteria.end')
      ? moment(campaign.get('criteria.end')).endOf('day')
      : moment().endOf('day');
    const pipeline = [
      {
        $match: {
          e: { $in: ['load-js', 'view-js', 'click-js', 'contextmenu-js'] },
          d: { $gte: start.toDate(), $lte: end.toDate() },
          cid: ObjectId(cid),
          cre: { $exists: true },
        },
      },
      {
        $project: {
          date: { $dateToString: { format: '%Y-%m-%d', date: '$d' } },
          e: '$e',
          cid: '$cid',
          cre: '$cre',
        },
      },
      {
        $group: {
          _id: {
            e: '$e',
            date: '$date',
            cre: '$cre',
          },
          n: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: false,
          date: '$_id.date',
          cre: '$_id.cre',
          view: { $cond: [{ $eq: ['$_id.e', 'view-js'] }, '$n', 0] },
          click: { $cond: [{ $eq: ['$_id.e', 'click-js'] }, '$n', 0] },
        },
      },
      {
        $group: {
          _id: {
            date: '$date',
            cre: '$cre',
          },
          views: { $sum: '$view' },
          clicks: { $sum: '$click' },
        },
      },
      {
        $project: {
          _id: false,
          date: '$_id.date',
          cre: '$_id.cre',
          views: '$views',
          clicks: '$clicks',
          ctr: getCtrProject(),
        },
      },
      {
        $sort: { date: 1 },
      },
      {
        $group: {
          _id: '$cre',
          days: { $push: '$$ROOT' },
          clicks: { $sum: '$clicks' },
          views: { $sum: '$views' },
        },
      },
      {
        $project: {
          id: '$_id',
          cre: '$_id.cre',
          days: '$days',
          views: '$views',
          clicks: '$clicks',
          ctr: getCtrProject(),
        },
      },
      {
        $group: {
          _id: null,
          creatives: { $push: '$$ROOT' },
          clicks: { $sum: '$clicks' },
          views: { $sum: '$views' },
        },
      },
      {
        $project: {
          _id: false,
          creatives: '$creatives',
          views: '$views',
          clicks: '$clicks',
          ctr: getCtrProject(),
        },
      },
    ];
    const results = await Analytics.aggregate(pipeline);
    const out = results[0];
    const dates = createDateRange(start, end);
    for (let i = 0; i < out.creatives.length; i += 1) {
      const id = out.creatives[i]._id;
      out.creatives[i].title = creativesById[id].title;
      out.creatives[i].teaser = creativesById[id].teaser;
      out.creatives[i].image = creativesById[id].image;
      out.creatives[i].days = dates.map(d => fillDayData(d, out.creatives[i].days));
    }
    return out;
  },
};
