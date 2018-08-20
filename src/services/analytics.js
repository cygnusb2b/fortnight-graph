const Placement = require('../models/placement');
const Campaign = require('../models/campaign');
const AnalyticsAction = require('../models/analytics/action');
const AnalyticsCampaign = require('../models/analytics/campaign');
const AnalyticsPlacement = require('../models/analytics/placement');

const mongoId = /[a-f0-9]{24}/;

module.exports = {
  async trackAction({ action, fields }) {
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

    const now = new Date();

    // Insert the raw action.
    const act = new AnalyticsAction({
      act: action,
      pid,
      cid: campaign ? campaign.id : undefined,
      cre: creativeId,
      d: now,
    });
    await act.save();

    // Now pre-aggregate
    const promises = [];
    const placementAgg = new AnalyticsPlacement({
      last: now,
      pid,
      pubid: placement.publisherId,
      tid: placement.topicId || undefined,
    });
    promises.push(placementAgg.preAggregate(action));

    if (campaign) {
      const campAgg = new AnalyticsCampaign({
        last: now,
        cid: campaign.id,
        cre: creativeId,
        advid: campaign.advertiserId,
      });
      promises.push(campAgg.preAggregate(action));
    }
    await Promise.all(promises);
  },
};
