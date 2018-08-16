const { Schema } = require('mongoose');
const moment = require('moment-timezone');

const schema = new Schema({
  /**
   * Placement ID
   */
  pid: {
    required: true,
    type: Schema.Types.ObjectId,
  },

  /**
   * Publisher ID
   */
  pubid: {
    required: true,
    type: Schema.Types.ObjectId,
  },

  /**
   * Campaign ID
   */
  tid: {
    type: Schema.Types.ObjectId,
  },

  day: {
    required: true,
    type: Schema.Types.Date,
    set: (v) => {
      if (!(v instanceof Date)) return undefined;
      return moment.tz(v, 'America/Chicago').startOf('day').toDate();
    },
  },

  last: {
    type: Date,
    required: true,
    set(v) {
      if (!(v instanceof Date)) return undefined;
      this.day = v;
      return v;
    },
  },

  views: {
    type: Number,
    default: 0,
  },

  clicks: {
    type: Number,
    default: 0,
  },
});

schema.index({ pubid: 1 });
schema.index({ pid: 1, day: 1 }, { unique: true });

schema.method('aggregateSave', async function preAggregate(metric) {
  await this.validate();
  const criteria = {
    pid: this.pid,
    day: this.day,
  };
  const $setOnInsert = {
    ...criteria,
    pubid: this.pubid,
    tid: this.tid || undefined,
  };
  const $set = { last: this.last };
  const $inc = { [metric]: 1 };
  const update = { $setOnInsert, $set, $inc };
  await this.model('analytics-placement').updateOne(criteria, update, { upsert: true });
});

module.exports = schema;
