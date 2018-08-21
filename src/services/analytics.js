const moment = require('moment');
const botDetector = require('./bot-detector');
const Placement = require('../models/placement');
const Campaign = require('../models/campaign');
const AnalyticsAction = require('../models/analytics/action');
const AnalyticsBot = require('../models/analytics/bot');
const AnalyticsCampaign = require('../models/analytics/campaign');
const AnalyticsPlacement = require('../models/analytics/placement');

const mongoId = /[a-f0-9]{24}/;

module.exports = {
  /**
   *
   * @param {object} params
   * @param {string} params.action The event action, e.g. `view` or `click`.
   * @param {object} params.fields The ad request fields, such as `pid` and `cid`.
   * @param {string} params.ua The request user agent string.
   */
  async trackAction({ action, fields, ua }) {
    // Validate action.
    if (!['view', 'click'].includes(action)) throw new Error(`The provided action '${action}' is not supported.`);

    // Validate required fields.
    const { pid, cid, cre } = fields;
    if (!pid || !mongoId.test(pid)) throw new Error(`The provided pid '${pid}' is invalid.`);
    if (cid && !mongoId.test(cid)) throw new Error(`The provided cid '${cid}' is invalid.`);
    if (cre && !mongoId.test(cre)) throw new Error(`The provided cre '${cre}' is invalid.`);

    // Validate that the placement, campaign, and creatives exists.
    const placement = await Placement.findOne({ _id: pid }, { _id: 1, publisherId: 1, topicId: 1 });
    if (!placement) throw new Error(`No placement was found for id '${pid}'`);

    let campaign;
    let creativeId;
    if (cid) {
      campaign = await Campaign.findOne({ _id: cid }, { _id: 1, 'creatives._id': 1, advertiserId: 1 });
      if (!campaign) throw new Error(`No campaign was found for id '${cid}'`);
      if (cre) {
        const creative = campaign.creatives.id(cre);
        if (!creative) throw new Error(`No creative was found for cid '${cid}' and cre '${cre}'`);
        creativeId = creative.id;
      }
    }

    const bot = botDetector.detect(ua);
    if (bot.detected) {
      // Insert bot data into seperate collection.
      await this.insertBot({ bot, ua });
    } else {
      // Proceed with insert/aggregating analytics.
      await this.insertEvents({
        action,
        ua,
        placement,
        campaign,
        creativeId,
      });
    }
  },

  /**
   * Inserts/pre-aggregates the analytics events.
   *
   * @param {object} params
   */
  async insertEvents({
    action,
    ua,
    placement,
    campaign,
    creativeId,
  }) {
    const now = new Date();
    // Insert the raw action.
    const act = this.createAnalyticsAction({
      now,
      action,
      ua,
      placement,
      campaign,
      creativeId,
    });
    await act.save();

    // Now pre-aggregate the placement and campaign analytics.
    const promises = [];
    promises
      .push(this.createAnalyticsPlacement({ now, placement }).preAggregate(action));
    if (campaign) {
      promises
        .push(this.createAnalyticsCampaign({ now, campaign, creativeId }).preAggregate(action));
    }
    return Promise.all(promises);
  },

  /**
   * Inserts bot/crawler data.
   *
   * @param {object} params
   */
  insertBot({ bot, ua }) {
    const doc = new AnalyticsBot({
      ua,
      bot,
    });
    return doc.preAggregate();
  },

  /**
   * Creates an AnalyticsAction model object.
   *
   * @param {object} params
   */
  createAnalyticsAction({
    now,
    action,
    ua,
    placement,
    campaign,
    creativeId,
  }) {
    return new AnalyticsAction({
      act: action,
      ua,
      pid: placement.id,
      cid: campaign ? campaign.id : undefined,
      cre: creativeId,
      d: now,
    });
  },

  /**
   * Creates an AnalyticsPlacement model object.
   *
   * @param {object} params
   */
  createAnalyticsPlacement({ now, placement }) {
    return new AnalyticsPlacement({
      last: now,
      pid: placement.id,
      pubid: placement.publisherId,
      tid: placement.topicId || undefined,
    });
  },

  /**
   * Creates an AnalyticsCampaign model object.
   *
   * @param {object} params
   */
  createAnalyticsCampaign({ now, campaign, creativeId }) {
    return new AnalyticsCampaign({
      last: now,
      cid: campaign.id,
      cre: creativeId,
      advid: campaign.advertiserId,
    });
  },

  getDefaultMetrics() {
    return { views: 0, clicks: 0, ctr: 0 };
  },

  createDateRange(start, end) {
    const dates = [];
    let current = start;
    while (current <= end) {
      dates.push(moment(current));
      current = moment(current).add(1, 'days');
    }
    return dates;
  },

  async retrieveMetrics($match) {
    const pipeline = [];
    pipeline.push({ $match });
    pipeline.push({
      $group: {
        _id: null,
        views: { $sum: '$view' },
        clicks: { $sum: '$click' },
      },
    });
    pipeline.push({
      $project: {
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
      },
    });

    const result = await AnalyticsCampaign.aggregate(pipeline);
    return result[0] ? result[0] : this.getDefaultMetrics();
  },

  async runCampaignByDayReport(criteria, { startDate, endDate }) {
    const results = await AnalyticsCampaign.aggregate([
      {
        $match: {
          day: { $gte: startDate, $lte: endDate },
          ...criteria,
        },
      },
      {
        $group: {
          _id: '$day',
          views: { $sum: '$view' },
          clicks: { $sum: '$click' },
        },
      },
      {
        $project: {
          _id: 0,
          day: '$_id',
          metrics: {
            views: '$views',
            clicks: '$clicks',
            ctr: {
              $cond: {
                if: { $eq: ['$views', 0] },
                then: 0,
                else: { $divide: ['$clicks', '$views'] },
              },
            },
          },
        },
      },
      {
        $sort: { day: 1 },
      },
    ]);
    const range = this.createDateRange(startDate, endDate);
    const days = results.map(({ day }) => moment(day).format('YYYY-MM-DD'));

    return range.map((date) => {
      const day = moment(date).format('YYYY-MM-DD');
      const index = days.findIndex(d => d === day);
      return index !== -1 ? results[index] : {
        day: date.toDate(),
        metrics: this.getDefaultMetrics(),
      };
    });
  },
};
