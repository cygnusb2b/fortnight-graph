const { Schema } = require('mongoose');
const slug = require('slug');
const connection = require('../connections/mongoose/instance');
const { applyElasticPlugin, setEntityFields } = require('../elastic/mongoose');
const {
  deleteablePlugin,
  imagePlugin,
  paginablePlugin,
  referencePlugin,
  repositoryPlugin,
  searchablePlugin,
  userAttributionPlugin,
} = require('../plugins');

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
  status: {
    type: String,
    required: true,
    default: 'Draft',
    enum: ['Placeholder', 'Draft', 'Ready'],
    es_indexed: true,
    es_type: 'keyword',
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
schema.plugin(deleteablePlugin, {
  es_indexed: true,
  es_type: 'boolean',
});
schema.plugin(userAttributionPlugin);
schema.plugin(imagePlugin, { fieldName: 'primaryImageId' });
schema.plugin(imagePlugin, { fieldName: 'imageIds', multiple: true });
schema.plugin(repositoryPlugin);
schema.plugin(paginablePlugin);
schema.plugin(searchablePlugin, { fieldNames: ['title', 'advertiserName'] });

schema.virtual('slug').get(function getSlug() {
  return slug(this.title).toLowerCase();
});

schema.pre('save', async function setAdvertiserName() {
  if (this.isModified('advertiserId') || !this.advertiserName) {
    const advertiser = await connection.model('advertiser').findOne({ _id: this.advertiserId }, { name: 1 });
    this.advertiserName = advertiser.name;
  }
});

schema.index({ advertiserId: 1 });
schema.index({ disposition: 1 });
schema.index({ title: 1, _id: 1 }, { unique: true });
schema.index({ title: -1, _id: -1 }, { unique: true });
schema.index({ updatedAt: 1, _id: 1 }, { unique: true });
schema.index({ updatedAt: -1, _id: -1 }, { unique: true });
schema.index({ publishedAt: 1, _id: 1 }, { unique: true });
schema.index({ publishedAt: -1, _id: -1 }, { unique: true });

module.exports = schema;
