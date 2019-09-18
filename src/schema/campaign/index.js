const { Schema } = require('mongoose');
const validator = require('validator');
const connection = require('../../connections/mongoose/instance');
const CreativeSchema = require('./creative');
const CriteriaSchema = require('./criteria');
const { applyElasticPlugin, setEntityFields } = require('../../elastic/mongoose');
const {
  deleteablePlugin,
  notifyPlugin,
  paginablePlugin,
  pushIdPlugin,
  referencePlugin,
  repositoryPlugin,
  searchablePlugin,
  userAttributionPlugin,
} = require('../../plugins');
const accountService = require('../../services/account');

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
  advertiserName: {
    type: String,
  },
  ready: {
    type: Boolean,
    required: true,
    default: false,
  },
  paused: {
    type: Boolean,
    required: true,
    default: false,
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
  requiredCreatives: {
    type: Number,
    default: 1,
  },
}, { timestamps: true });

setEntityFields(schema, 'name');
setEntityFields(schema, 'advertiserName');
applyElasticPlugin(schema, 'campaigns');

schema.plugin(referencePlugin, {
  name: 'advertiserId',
  connection,
  modelName: 'advertiser',
  options: { required: true, es_indexed: true, es_type: 'keyword' },
});
schema.plugin(referencePlugin, {
  name: 'storyId',
  connection,
  modelName: 'story',
  options: { required: false },
});

schema.plugin(deleteablePlugin, {
  es_indexed: true,
  es_type: 'boolean',
});
schema.plugin(notifyPlugin);
schema.plugin(pushIdPlugin, { required: true });
schema.plugin(repositoryPlugin);
schema.plugin(userAttributionPlugin);
schema.plugin(paginablePlugin);
schema.plugin(searchablePlugin, { fieldNames: ['name', 'advertiserName'] });

schema.virtual('status').get(function getStatus() {
  const start = this.get('criteria.start');
  const end = this.get('criteria.end');

  if (this.deleted) return 'Deleted';
  if (end && end.valueOf() <= Date.now()) return 'Finished';
  if (!this.ready) return 'Incomplete';
  if (this.paused) return 'Paused';
  if (start.valueOf() <= Date.now()) return 'Running';
  return 'Scheduled';
});

schema.method('clone', async function clone(user) {
  const Model = connection.model('campaign');
  const { _doc } = this;
  const input = {
    ..._doc,
    name: `${this.name} copy`,
  };
  ['id', '_id', 'pushId', 'createdAt', 'updatedAt', 'updatedBy', 'createdBy'].forEach(k => delete input[k]);
  input.creatives.forEach(cre => cre._id = undefined); // eslint-disable-line

  const doc = new Model(input);
  doc.setUserContext(user);
  return doc.save();
});

schema.method('getRequirements', async function getRequirements() {
  const {
    storyId,
    url,
    criteria,
    creatives,
    requiredCreatives,
  } = this;

  const needs = [];
  const start = criteria.get('start');
  if (!start) needs.push('a start date');
  if (!criteria.get('placementIds.length')) needs.push('a placement');
  if (creatives.filter(cre => cre.active).length < requiredCreatives) {
    needs.push(`at least ${requiredCreatives} active creative(s)`);
  }
  if (storyId) {
    const story = await connection.model('story').findById(storyId);
    const storyNeed = 'an active story';

    if (story.status === 'Scheduled') {
      if (start && story.publishedAt.valueOf() > start.valueOf()) {
        needs.push(storyNeed);
      }
    } else if (story.status !== 'Published') {
      needs.push(storyNeed);
    }
  } else if (!url) {
    needs.push('a URL');
  }
  return needs.sort().join(', ');
});

schema.pre('validate', async function setRequiredCreatives() {
  const account = await accountService.retrieve();
  const requiredCreatives = account.get('settings.requiredCreatives');
  if (this.isNew) {
    this.requiredCreatives = requiredCreatives;
  }
});

schema.pre('save', async function setAdvertiserForStory() {
  if (this.isModified('storyId')) {
    const story = await connection.model('story').strictFindById(this.storyId, { advertiserId: 1 });
    this.advertiserId = story.advertiserId;
  }
});

schema.pre('save', async function setAdvertiserName() {
  if (this.isModified('advertiserId') || !this.advertiserName) {
    const advertiser = await connection.model('advertiser').findOne({ _id: this.advertiserId }, { name: 1 });
    this.advertiserName = advertiser.name;
  }
});

schema.pre('save', async function setReady() {
  const needs = await this.getRequirements();
  if (needs.length) {
    this.ready = false;
  } else {
    this.ready = true;
  }
});

schema.index({ advertiserId: 1 });
schema.index({ 'creatives.deleted': 1 });
schema.index({ name: 1, _id: 1 }, { unique: true });
schema.index({ name: -1, _id: -1 }, { unique: true });
schema.index({ updatedAt: 1, _id: 1 }, { unique: true });
schema.index({ updatedAt: -1, _id: -1 }, { unique: true });

// Query logic for campaign retrieval.
schema.index({
  deleted: 1,
  ready: 1,
  paused: 1,
  'criteria.start': 1,
  'criteria.placementIds': 1,
  'criteria.end': 1,
});

module.exports = schema;
