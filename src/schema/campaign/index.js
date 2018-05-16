const mongoose = require('mongoose');
const validator = require('validator');
const CreativeSchema = require('./creative');
const CriteriaSchema = require('./criteria');
const uuid = require('uuid/v4');
const uuidParse = require('uuid-parse');
const notifyPlugin = require('../../plugins/notify');
const { applyElasticPlugin, setEntityFields } = require('../../elastic/mongoose');

const { Schema } = mongoose;

const externalLinkSchema = new Schema({
  label: {
    type: String,
    required: false,
    trim: true,
  },
  url: {
    type: String,
    required: true,
    trim: true,
    validate: {
      validator(v) {
        if (!v) return false;
        return validator.isURL(v, {
          protocols: ['http', 'https'],
          require_protocol: true,
        });
      },
      message: 'Invalid external link URL for {VALUE}',
    },
  },
});

const schema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: false,
    trim: false,
  },
  hash: {
    type: String,
    required: true,
    unique: true,
    default() {
      return uuid();
    },
    validate: {
      validator(v) {
        return v === uuidParse.unparse(uuidParse.parse(v));
      },
      message: 'Invalid campaign hash for {VALUE}',
    },
  },
  advertiserId: {
    type: Schema.Types.ObjectId,
    required: true,
    validate: {
      async validator(v) {
        const doc = await mongoose.model('advertiser').findOne({ _id: v }, { _id: 1 });
        if (doc) return true;
        return false;
      },
      message: 'No advertiser found for ID {VALUE}',
    },
  },
  advertiserName: {
    type: String,
  },
  status: {
    type: String,
    required: true,
    default: 'Draft',
    enum: [
      'Active',
      'Paused',
      'Draft',
      'Deleted',
    ],
  },
  url: {
    type: String,
    trim: true,
    validate: {
      validator(v) {
        if (!v) return true;
        return validator.isURL(v, {
          protocols: ['http', 'https'],
          require_protocol: true,
        });
      },
      message: 'Invalid campaign URL for {VALUE}',
    },
  },
  creatives: [CreativeSchema],
  criteria: CriteriaSchema,
  externalLinks: [externalLinkSchema],
}, { timestamps: true });

schema.pre('save', async function setAdvertiserName() {
  if (this.isModified('advertiserId') || !this.advertiserName) {
    const advertiser = await mongoose.model('advertiser').findOne({ _id: this.advertiserId }, { name: 1 });
    this.advertiserName = advertiser.name;
  }
});

schema.plugin(notifyPlugin);

setEntityFields(schema, 'name');
setEntityFields(schema, 'advertiserName');
applyElasticPlugin(schema, 'campaigns');

schema.index({ hash: 1 });
schema.index({ advertiserId: 1 });
schema.index({ name: 1, _id: 1 }, { unique: true });
schema.index({ name: -1, _id: -1 }, { unique: true });
schema.index({ updatedAt: 1, _id: 1 }, { unique: true });
schema.index({ updatedAt: -1, _id: -1 }, { unique: true });

// Query logic for campaign retrieval.
schema.index({
  status: 1,
  'criteria.start': 1,
  'criteria.placementIds': 1,
  'criteria.end': 1,
});

module.exports = schema;
