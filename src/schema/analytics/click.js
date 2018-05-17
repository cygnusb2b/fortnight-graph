const { Schema } = require('mongoose');
const analyticsPlugin = require('../../plugins/analytics');

const schema = new Schema({
  cid: {
    type: Schema.Types.ObjectId,
  },
});
schema.plugin(analyticsPlugin);

schema.index({ cid: 1, hash: 1, hour: 1 }, { unique: true });

schema.methods.aggregateSave = async function aggregateSave() {
  await this.validate();
  const $setOnInsert = {
    cid: this.cid || null,
    hash: this.hash,
    hour: this.hour,
  };
  const $set = { last: this.last };
  const $inc = { n: 1 };
  const update = { $setOnInsert, $set, $inc };

  const criteria = {
    cid: this.cid || null,
    hash: this.hash,
    hour: this.hour,
  };
  await this.model('analytics-click').findOneAndUpdate(criteria, update, { upsert: true });
};

module.exports = schema;
