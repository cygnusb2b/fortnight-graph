const { Schema } = require('mongoose');
const connection = require('../connections/mongoose/instance');
const {
  deleteablePlugin,
  paginablePlugin,
  referencePlugin,
  repositoryPlugin,
  userAttributionPlugin,
} = require('../plugins');

const { isArray } = Array;

const datesSchema = new Schema({
  type: {
    type: String,
    enum: ['range', 'days'],
    default: 'days',
  },
  start: {
    type: Date,
  },
  end: {
    type: Date,
  },
  days: {
    type: [Date],
    default: [],
  },
});

const schema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  ready: {
    type: Boolean,
    default: false,
  },
  paused: {
    type: Boolean,
    default: false,
  },
  dates: {
    type: datesSchema,
    default: () => ({}),
  },
}, { timestamps: true });

schema.plugin(referencePlugin, {
  name: 'emailPlacementId',
  connection,
  modelName: 'email-placement',
  options: { required: true },
});
schema.plugin(referencePlugin, {
  name: 'campaignId',
  connection,
  modelName: 'campaign',
  options: { required: true },
});
schema.plugin(deleteablePlugin, {
  es_indexed: true,
  es_type: 'boolean',
});
schema.plugin(repositoryPlugin);
schema.plugin(userAttributionPlugin);
schema.plugin(paginablePlugin);

schema.virtual('status').get(function getStatus() {
  const { dates } = this;

  const now = Date.now();
  let newestDay;
  let oldestDay;
  if (dates.type === 'days') {
    const days = isArray(dates.days) ? dates.days : [];
    const times = days.map(d => d.valueOf()).sort();
    [oldestDay] = times;
    [newestDay] = times.reverse();
  }

  if (this.deleted) return 'Deleted';
  if (dates.type === 'range' && dates.end && dates.end.valueOf() <= now) return 'Finished';
  if (dates.type === 'days' && newestDay && newestDay.valueOf() <= now) return 'Finished';
  if (!this.ready) return 'Incomplete';
  if (this.paused) return 'Paused';
  if (dates.type === 'range' && dates.start && dates.start.valueOf() <= now) return 'Running';
  // @todo this should be changed to see if the current date is between days. If so, scheduled.
  if (dates.type === 'days' && oldestDay && oldestDay.valueOf() <= now) return 'Running';
  return 'Scheduled';
});

schema.method('getRequirements', async function getRequirements() {
  const { dates } = this;
  const needs = [];

  const datesNeeds = 'a valid date range or selection of days';
  switch (dates.type) {
    case 'range':
      if (!dates.start || !dates.end) needs.push(datesNeeds);
      break;
    case 'days':
      if (!isArray(dates.days) || !dates.days.length) needs.push(datesNeeds);
      break;
    default:
      needs.push(datesNeeds);
      break;
  }

  const campaignNeeds = 'an active campaign with at least one active creative';
  const campaign = await connection.model('campaign').findOne({ campaignId: this.campaignId, deleted: false });
  if (campaign) {
    const activeCreatives = isArray(campaign.creatives)
      ? campaign.creatives.filter(cre => cre.active)
      : [];
    if (!activeCreatives.length) needs.push(campaignNeeds);
  } else {
    needs.push(campaignNeeds);
  }
  return needs.sort().join(', ');
});

schema.pre('save', async function setReady() {
  const needs = await this.getRequirements();
  if (needs.length) {
    this.ready = false;
  } else {
    this.ready = true;
  }
});

schema.index({ campaignId: 1, emailPlacementId: 1 });
schema.index({ emailPlacementId: 1 });
schema.index({ name: 1, _id: 1 });
schema.index({ updatedAt: 1, _id: 1 });

module.exports = schema;
