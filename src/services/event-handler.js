const BotDetector = require('./bot-detector');
const Utils = require('../utils');
const Placement = require('../models/placement');
const Campaign = require('../models/campaign');
const AnalyticsEvent = require('../models/analytics/event');

const actions = ['load', 'view', 'click', 'contextmenu'];
const mongoId = /[a-f0-9]{24}/;

module.exports = {
  async track({
    action,
    fields,
    ua,
    ip,
    ref,
  }) {
    // Validate action.
    if (!actions.includes(action)) throw new Error(`The provided action '${action}' is not supported.`);

    // Validate required fields.
    const {
      pid,
      uuid,
      cid,
      cre,
    } = fields;
    if (!pid || !mongoId.test(pid)) throw new Error(`The provided pid '${pid}' is invalid.`);
    if (!uuid || !Utils.uuid.is(uuid)) throw new Error(`The provided uuid '${uuid}' is invalid.`);
    if (cid && !mongoId.test(cid)) throw new Error(`The provided cid '${cid}' is invalid.`);
    if (cre && !mongoId.test(cre)) throw new Error(`The provided cre '${cre}' is invalid.`);

    // Validate that the placement, campaign, and creatives exists.
    const placement = await Placement.findOne({ _id: pid }, { _id: 1 });
    if (!placement) throw new Error(`No placement was found for id '${pid}'`);

    let creativeId;
    if (cid) {
      const campaign = await Campaign.findOne({ _id: cid }, { _id: 1, 'creatives._id': 1 });
      if (!campaign) throw new Error(`No campaign was found for id '${cid}'`);
      if (cre) {
        const creative = campaign.creatives.id(cre);
        if (!creative) throw new Error(`No creative was found for cid '${cid}' and cre '${cre}'`);
        creativeId = creative.id;
      }
    }

    // Insert the event.
    const bot = BotDetector.detect(ua);
    const doc = new AnalyticsEvent({
      e: `${action}-js`,
      uuid,
      pid,
      cid,
      cre: creativeId,
      d: new Date(),
      bot,
      ua,
      ref,
      ip,
    });
    const event = await doc.save();
    return event;
  },
};
