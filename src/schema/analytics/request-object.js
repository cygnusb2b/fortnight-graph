const { Schema } = require('mongoose');
const hash = require('object-hash');
const Utils = require('../../utils');

const schema = new Schema({
  hash: {
    type: String,
    required: true,
    unique: true,
  },
  pid: {
    type: Schema.Types.ObjectId,
    required: true,
  },
  kv: {
    type: Schema.Types.Mixed,
    required: true,
    /**
     * @todo Eventually this needs to limited by keys that are acceptable (in the database).
     */
    set: kv => Utils.cleanValues(kv),
  },
});

schema.virtual('hashObj').get(function getToHash() {
  return {
    pid: this.pid ? this.pid.toString() : null,
    kv: this.kv || {},
  };
});

schema.methods.buildHash = function createHash() {
  this.hash = hash(this.hashObj, { algorithm: 'md5' });
  return this;
};

schema.methods.aggregateSave = async function aggregateSave() {
  this.buildHash();
  await this.validate();
  const $setOnInsert = {
    pid: this.pid,
    hash: this.hash,
    kv: this.kv,
  };
  const update = { $setOnInsert };
  await this.model('analytics-request-object').findOneAndUpdate({ hash: this.hash }, update, { upsert: true });
};

module.exports = schema;
