const { Schema } = require('mongoose');
const { isURL } = require('validator');
const slug = require('slug');
const connection = require('../connections/mongoose/instance');
const { applyElasticPlugin, setEntityFields } = require('../elastic/mongoose');
const {
  deleteablePlugin,
  imagePlugin,
  notifyPlugin,
  paginablePlugin,
  pushIdPlugin,
  repositoryPlugin,
  searchablePlugin,
  userAttributionPlugin,
} = require('../plugins');

const schema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  externalId: {
    type: String,
    required: false,
    trim: true,
  },
  website: {
    type: String,
    trim: true,
    validate: {
      validator(v) {
        if (!v) return true;
        return isURL(v, {
          protocols: ['http', 'https'],
          require_protocol: true,
        });
      },
      message: 'Invalid publisher website URL for {VALUE}',
    },
  },
}, { timestamps: true });

setEntityFields(schema, 'name');
applyElasticPlugin(schema, 'advertisers');

schema.plugin(notifyPlugin);
schema.plugin(imagePlugin, { fieldName: 'logoImageId' });
schema.plugin(pushIdPlugin, { required: true });
schema.plugin(deleteablePlugin, {
  es_indexed: true,
  es_type: 'boolean',
});
schema.plugin(userAttributionPlugin);
schema.plugin(repositoryPlugin);
schema.plugin(paginablePlugin);
schema.plugin(searchablePlugin, { fieldNames: ['name'] });

schema.virtual('slug').get(function getSlug() {
  return slug(this.name).toLowerCase();
});

schema.pre('save', async function checkDelete() {
  if (!this.isModified('deleted') || !this.deleted) return;

  const stories = await connection.model('story').countActive({ advertiserId: this.id });
  if (stories) throw new Error('You cannot delete an advertiser that has related stories.');
  const campaigns = await connection.model('campaign').countActive({ advertiserId: this.id });
  if (campaigns) throw new Error('You cannot delete an advertiser that has related campaigns.');
});

schema.pre('save', async function updateCampaigns() {
  if (this.isModified('name')) {
    // This isn't as efficient as calling `updateMany`, but the ElasticSearch
    // plugin will not fire properly otherwise.
    // As such, do not await the update.
    const Campaign = connection.model('campaign');
    const campaigns = await Campaign.find({ advertiserId: this.id });
    campaigns.forEach((campaign) => {
      campaign.set('advertiserName', this.name);
      campaign.save();
    });

    const Story = connection.model('story');
    const stories = await Story.find({ advertiserId: this.id });
    stories.forEach((story) => {
      story.set('advertiserName', this.name);
      story.save();
    });
  }
});

schema.index({ name: 1, _id: 1 }, { unique: true });
schema.index({ name: -1, _id: -1 }, { unique: true });
schema.index({ updatedAt: 1, _id: 1 }, { unique: true });
schema.index({ updatedAt: -1, _id: -1 }, { unique: true });

module.exports = schema;
