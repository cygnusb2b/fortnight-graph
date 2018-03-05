const { Schema } = require('mongoose');

const schema = new Schema({
  hash: {
    type: String,
    required: true,
  },
  hour: {
    type: Date,
    required: true,
    default: () => new Date(),
    set: (v) => {
      v.setMilliseconds(0);
      v.setSeconds(0);
      v.setMinutes(0);
      return v;
    },
  },
  last: {
    type: Date,
    required: true,
    default: () => new Date(),
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
