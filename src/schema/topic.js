const { Schema } = require('mongoose');
const connection = require('../connections/mongoose/instance');
const { applyElasticPlugin, setEntityFields } = require('../elastic/mongoose');
const {
  paginablePlugin,
  referencePlugin,
  repositoryPlugin,
  searchablePlugin,
} = require('../plugins');

const schema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  publisherName: {
    type: String,
  },
  externalId: {
    type: String,
    trim: true,
  },
}, { timestamps: true });

setEntityFields(schema, 'name');
setEntityFields(schema, 'publisherName');
applyElasticPlugin(schema, 'topics');

schema.plugin(referencePlugin, {
  name: 'publisherId',
  connection,
  modelName: 'publisher',
  options: { required: true, es_indexed: true, es_type: 'keyword' },
});
schema.plugin(repositoryPlugin);
schema.plugin(paginablePlugin);
schema.plugin(searchablePlugin, { fieldNames: ['name', 'publisherName'] });

schema.pre('save', async function setPublisherName() {
  if (this.isModified('publisherId') || !this.publisherName) {
    const publisher = await connection.model('publisher').findOne({ _id: this.publisherId }, { name: 1 });
    this.publisherName = publisher.name;
  }
});

schema.pre('save', async function updatePlacements() {
  if (this.isModified('name')) {
    // This isn't as efficient as calling `updateMany`, but the ElasticSearch
    // plugin will not fire properly otherwise.
    // As such, do not await the update.
    const Placement = connection.model('placement');
    const docs = await Placement.find({ topicId: this.id });
    docs.forEach((doc) => {
      doc.set('topicName', this.name);
      doc.save();
    });
  }
});

schema.index({ publisherId: 1, name: 1 }, { unique: true });
schema.index({ name: 1, _id: 1 }, { unique: true });
schema.index({ name: -1, _id: -1 }, { unique: true });
schema.index({ updatedAt: 1, _id: 1 }, { unique: true });
schema.index({ updatedAt: -1, _id: -1 }, { unique: true });

module.exports = schema;
