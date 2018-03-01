const { Schema } = require('mongoose');
// const objectHash = require('object-hash');
const CampaignPlacementRepo = require('../../repositories/campaign/placement');

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
    set: (v) => {
      v.setMilliseconds(0);
      v.setSeconds(0);
      v.setMinutes(0);
      return v;
    },
  },
  kv: {
    type: Schema.Types.Mixed,
    required: true,
    set: v => CampaignPlacementRepo.cleanTargetingVars(v),
  },
  n: {
    type: Number,
    default: 0,
  },
});

schema.index()

module.exports = schema;
