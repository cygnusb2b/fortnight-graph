const { Schema } = require('mongoose');
const hash = require('object-hash');
const isScalar = require('../../utils/is-scalar');

const schema = new Schema({
  hash: {
    type: String,
    unique: true,
    required: true,
  },
  pid: {
    type: Schema.Types.ObjectId,
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
  kv: {
    type: Schema.Types.Mixed,
    required: true,
    /**
     * @todo Eventually this needs to limit by vars that are acceptable.
     */
    set: (kv) => {
      const toClean = kv && typeof kv === 'object' ? kv : {};
      const cleaned = {};
      Object.keys(toClean).forEach((key) => {
        const v = toClean[key];
        const empty = v === null || v === undefined || v === '';
        if (!empty && isScalar(v)) {
          cleaned[key] = v;
        }
      });
      return cleaned;
    },
  },
  n: {
    type: Number,
    default: 0,
  },
});

schema.index({ hash: 1, hour: 1 }, { unique: true });

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
    hash: this.hash,
    pid: this.pid,
    kv: this.kv,
    hour: this.hour,
  };
  const $set = { last: new Date() };
  const $inc = { n: 1 };
  const update = { $setOnInsert, $set, $inc };

  await this.model('analytics-request').findOneAndUpdate({ hash: this.hash, hour: this.hour }, update, { upsert: true });
};

module.exports = schema;
