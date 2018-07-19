const { Schema } = require('mongoose');
const connection = require('../connections/mongoose/instance');
const { applyElasticPlugin, setEntityFields } = require('../elastic/mongoose');
const {
  notifyPlugin,
  imagePlugin,
  pushIdPlugin,
  repositoryPlugin,
  searchablePlugin,
} = require('../plugins');

const schema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true,
  },
}, { timestamps: true });

setEntityFields(schema, 'name');
applyElasticPlugin(schema, 'advertisers');

schema.plugin(notifyPlugin);
schema.plugin(imagePlugin, { fieldName: 'logoImageId' });
schema.plugin(pushIdPlugin, { required: true });
schema.plugin(repositoryPlugin);
schema.plugin(searchablePlugin, { fieldNames: ['name'] });

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
