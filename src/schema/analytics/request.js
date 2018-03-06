const { Schema } = require('mongoose');
const moment = require('moment');

const schema = new Schema({
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
  hour: {
    type: Date,
    required: true,
    set: (v) => {
      if (!(v instanceof Date)) return undefined;
      const date = moment(v);
      date.utc().startOf('hour');
      return date.toDate();
    },
  },
  last: {
    type: Date,
    required: true,
    set(v) {
      if (!(v instanceof Date)) return undefined;
      this.hour = v;
      return v;
    },
  },
  n: {
    type: Number,
    default: 0,
  },
});

schema.index({ hash: 1, hour: 1 }, { unique: true });

schema.methods.aggregateSave = async function aggregateSave(num = 1) {
  const n = num && num >= 1 ? num : 1;
  await this.validate();
  const $setOnInsert = {
    hash: this.hash,
    hour: this.hour,
  };
  const $set = { last: this.last };
  const $inc = { n };
  const update = { $setOnInsert, $set, $inc };

  await this.model('analytics-request').findOneAndUpdate({ hash: this.hash, hour: this.hour }, update, { upsert: true });
};

module.exports = schema;
