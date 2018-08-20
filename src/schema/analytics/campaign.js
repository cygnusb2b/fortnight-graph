const { Schema } = require('mongoose');
const moment = require('moment-timezone');

const schema = new Schema({
  /**
   * Campaign ID
   */
  cid: {
    required: true,
    type: Schema.Types.ObjectId,
  },

  /**
   * Creative ID
   */
  cre: {
    required: true,
    type: Schema.Types.ObjectId,
  },

  /**
   * Campaign ID
   */
  advid: {
    required: true,
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

  view: {
    type: Number,
    default: 0,
  },

  click: {
    type: Number,
    default: 0,
  },
});

schema.index({ advid: 1 });
schema.index({ cid: 1, cre: 1, day: 1 }, { unique: true });

schema.method('preAggregate', async function preAggregate(action) {
  await this.validate();
  const criteria = {
    cid: this.cid,
    cre: this.cre,
    day: this.day,
  };
  const $setOnInsert = {
    ...criteria,
    advid: this.advid,
  };
  const $set = { last: this.last };
  const $inc = { [action]: 1 };
  const update = { $setOnInsert, $set, $inc };
  await this.model('analytics-campaign').updateOne(criteria, update, { upsert: true });
});

module.exports = schema;
