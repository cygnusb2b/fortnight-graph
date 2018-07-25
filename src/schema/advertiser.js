const { Schema } = require('mongoose');
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

schema.method('cascadeSoftDelete', function cascadeSoftDelete() {
  const promises = [];
  promises.push(connection.model('story').updateMany({
    advertiserId: this.id,
  }, { $set: { deleted: true } }));

  // @todo Change this once campaigns support soft delete and status is different.
  promises.push(connection.model('campaign').updateMany({
    advertiserId: this.id,
  }, { $set: { status: 'Deleted' } }));

  return Promise.all(promises);
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
