const { Schema } = require('mongoose');
const slug = require('slug');
const connection = require('../connections/mongoose/instance');
const { applyElasticPlugin, setEntityFields } = require('../elastic/mongoose');
const {
  deleteablePlugin,
  imagePlugin,
  paginablePlugin,
  pushIdPlugin,
  referencePlugin,
  repositoryPlugin,
  searchablePlugin,
  userAttributionPlugin,
} = require('../plugins');
const storyUrl = require('../utils/story-url');
const accountService = require('../services/account');

const schema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  teaser: {
    type: String,
    trim: true,
  },
  body: {
    type: String,
    trim: true,
  },
  advertiserName: {
    type: String,
  },
  placeholder: {
    type: Boolean,
    default: false,
    required: true,
    es_indexed: true,
    es_type: 'boolean',
  },
  publishedAt: {
    type: Date,
    es_indexed: true,
    es_type: 'date',
  },
}, { timestamps: true });

setEntityFields(schema, 'title');
setEntityFields(schema, 'advertiserName');
applyElasticPlugin(schema, 'stories');

schema.plugin(referencePlugin, {
  name: 'advertiserId',
  connection,
  modelName: 'advertiser',
  options: { required: true, es_indexed: true, es_type: 'keyword' },
});
schema.plugin(referencePlugin, {
  name: 'publisherId',
  connection,
  modelName: 'publisher',
  options: { required: true },
});
schema.plugin(deleteablePlugin, {
  es_indexed: true,
  es_type: 'boolean',
});
schema.plugin(pushIdPlugin, { required: true });
schema.plugin(userAttributionPlugin);
schema.plugin(imagePlugin, { fieldName: 'primaryImageId' });
schema.plugin(imagePlugin, { fieldName: 'imageIds', multiple: true });
schema.plugin(repositoryPlugin);
schema.plugin(paginablePlugin);
schema.plugin(searchablePlugin, { fieldNames: ['title', 'advertiserName'] });

schema.virtual('slug').get(function getSlug() {
  return slug(this.title).toLowerCase();
});

schema.virtual('status').get(function getStatus() {
  const { publishedAt } = this;
  if (this.deleted) return 'Deleted';
  if (this.placeholder) return 'Placeholder';
  if (publishedAt && publishedAt.valueOf() <= Date.now()) return 'Published';
  if (publishedAt && publishedAt.valueOf() > Date.now()) return 'Scheduled';
  return 'Draft';
});

schema.method('getPath', async function getPath() {
  const advertiser = await connection.model('advertiser').findById(this.advertiserId);
  return `${advertiser.slug}/${this.slug}/${this.id}`;
});

schema.method('getUrl', async function getUrl(params) {
  const account = await accountService.retrieve();
  const path = await this.getPath();
  return storyUrl(account.storyUri, path, params);
});

schema.pre('save', async function checkDelete() {
  if (!this.isModified('deleted') || !this.deleted) return;
  const count = await connection.model('campaign').countActive({ storyId: this.id });
  if (count) throw new Error('You cannot delete a story that has related campaigns.');
});

schema.pre('save', async function setAdvertiserName() {
  if (this.isModified('advertiserId') || !this.advertiserName) {
    const advertiser = await connection.model('advertiser').findOne({ _id: this.advertiserId }, { name: 1 });
    this.advertiserName = advertiser.name;
  }
});

schema.pre('save', async function checkCampaigns() {
  const { publishedAt } = this;
  if (!this.isModified('publishedAt')) return;

  const campaigns = await connection.model('campaign').findActive({ storyId: this.id });
  campaigns.forEach((campaign) => {
    if (['Paused', 'Running', 'Scheduled'].includes(campaign.status) && !publishedAt) {
      // Published date was unset. Do not allow this if associated campaigns are active.
      throw new Error('Cannot unpublish: there are active campaigns running for this story.');
    }
    if (['Paused', 'Running'].includes(campaign.status) && publishedAt && publishedAt.valueOf() > Date.now()) {
      // Published date was set and it's greater than a paused/running campaign's start.
      throw new Error('Cannot change published date: the selected value would conflict with active campaigns.');
    }
    if (campaign.status === 'Scheduled' && publishedAt && publishedAt.valueOf() > campaign.get('criteria.start').valueOf()) {
      // Published date was set and it's greater than a scheduled campaign's start.
      throw new Error('Cannot change published date: the selected value would conflict with scheduled campaigns.');
    }
  });
});

schema.post('save', async function handlePublishedAt() {
  if (this.status === 'Published') {
    // Find all related campaigns and ensure they're resaved to account for the published changed.
    const campaigns = await connection.model('campaign').findActive({ storyId: this.id, ready: false });
    const promises = campaigns.map(campaign => campaign.save());
    await Promise.all(promises);
  }
});

schema.index({ advertiserId: 1 });
schema.index({ placeholder: 1 });
schema.index({ title: 1, _id: 1 }, { unique: true });
schema.index({ title: -1, _id: -1 }, { unique: true });
schema.index({ updatedAt: 1, _id: 1 }, { unique: true });
schema.index({ updatedAt: -1, _id: -1 }, { unique: true });
schema.index({ publishedAt: 1, _id: 1 }, { unique: true });
schema.index({ publishedAt: -1, _id: -1 }, { unique: true });

module.exports = schema;
