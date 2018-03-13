const { Schema } = require('mongoose');
const moment = require('moment');

const schema = new Schema({
  e: {
    type: String,
    enum: ['request', 'load', 'view', 'click'],
  },
  value: {
    type: String,
    required: true,
    trim: true,
  },
  hash: {
    type: String,
    required: true,
    validate: {
      validator(v) {
        return /[a-f0-9]{32}/.test(v);
      },
      message: 'Invalid hash value for {VALUE}',
    },
  },
  day: {
    type: Date,
    required: true,
    set: (v) => {
      if (!(v instanceof Date)) return undefined;
      const date = moment(v);
      date.utc().startOf('day');
      return date.toDate();
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
  n: {
    type: Number,
    default: 0,
  },
  cid: {
    type: Schema.Types.ObjectId,
  },
});

schema.index({
  e: 1,
  value: 1,
  cid: 1,
  hash: 1,
  day: 1,
}, { unique: true });

schema.methods.aggregateSave = async function aggregateSave() {
  await this.validate();
  const $setOnInsert = {
    e: this.e,
    value: this.value || null,
    cid: this.cid || null,
    hash: this.hash,
    day: this.day,
  };
  const $set = { last: this.last };
  const $inc = { n: 1 };
  const update = { $setOnInsert, $set, $inc };

  const criteria = {
    e: this.e,
    value: this.value || null,
    cid: this.cid || null,
    hash: this.hash,
    day: this.day,
  };
  await this.model('analytics-bot').findOneAndUpdate(criteria, update, { upsert: true });
};

module.exports = schema;
