const { Schema } = require('mongoose');
const connection = require('../../connections/mongoose/instance');
const validator = require('validator');
const CreativeSchema = require('./creative');
const CriteriaSchema = require('./criteria');
const notifyPlugin = require('../../plugins/notify');
const pushIdPlugin = require('../../plugins/push-id');
const { applyElasticPlugin, setEntityFields } = require('../../elastic/mongoose');

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
  advertiserId: {
    type: Schema.Types.ObjectId,
    required: true,
    validate: {
      async validator(v) {
        const doc = await connection.model('advertiser').findOne({ _id: v }, { _id: 1 });
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
    const advertiser = await connection.model('advertiser').findOne({ _id: this.advertiserId }, { name: 1 });
    this.advertiserName = advertiser.name;
  }
});

schema.virtual('portalUri').get(async function getPortalUri() {
  const advertiser = await connection.model('advertiser').findOne({ _id: this.advertiserId }, { pushId: 1 });
  const uri = await advertiser.get('portalUri');
  return `${uri}/campaigns/${this.pushId}`;
});

schema.virtual('vMaterialCollectUri').get(async function getVMCU() {
  const uri = await this.get('portalUri');
  return `${uri}/materials`;
});

schema.virtual('vReportSummaryUri').get(async function getVRSU() {
  const uri = await this.get('portalUri');
  return `${uri}/report/summary`;
});

schema.virtual('vReportCreativeUri').get(async function getVRCU() {
  const uri = await this.get('portalUri');
  return `${uri}/report/creative-breakdown`;
});

schema.plugin(notifyPlugin);
schema.plugin(pushIdPlugin, { required: true });

setEntityFields(schema, 'name');
setEntityFields(schema, 'advertiserName');
applyElasticPlugin(schema, 'campaigns');

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
