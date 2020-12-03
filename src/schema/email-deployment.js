const { Schema } = require('mongoose');
const connection = require('../connections/mongoose/instance');
const { applyElasticPlugin, setEntityFields } = require('../elastic/mongoose');
const {
  deleteablePlugin,
  paginablePlugin,
  referencePlugin,
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
  publisherName: {
    type: String,
  },
}, { timestamps: true });

setEntityFields(schema, 'name');
setEntityFields(schema, 'publisherName');
applyElasticPlugin(schema, 'email-deployments');

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
schema.plugin(userAttributionPlugin);
schema.plugin(repositoryPlugin);
schema.plugin(paginablePlugin);
schema.plugin(searchablePlugin, { fieldNames: ['name', 'publisherName'] });

schema.pre('save', async function checkDelete() {
  if (!this.isModified('deleted') || !this.deleted) return;

  const [emailPlacements] = await Promise.all([
    connection.model('email-placement').countActive({ publisherId: this.id }),
  ]);
  if (emailPlacements) throw new Error('You cannot delete an email deployment that has related placements.');
});

schema.pre('save', async function setPublisherName() {
  if (this.isModified('publisherId') || !this.publisherName) {
    const publisher = await connection.model('publisher').findOne({ _id: this.publisherId }, { name: 1 });
    this.publisherName = publisher.name;
  }
});

schema.pre('save', async function updateEmailPlacements() {
  if (this.isModified('name')) {
    // This isn't as efficient as calling `updateMany`, but the ElasticSearch
    // plugin will not fire properly otherwise.
    // As such, do not await the update.
    const EmailPlacement = connection.model('email-placement');
    const docs = await EmailPlacement.find({ deploymentId: this.id });
    docs.forEach((doc) => {
      doc.set('deploymentName', this.name);
      doc.save();
    });
  }
});

schema.index({ publisherId: 1 });
schema.index({ name: 1, _id: 1 }, { unique: true });
schema.index({ name: -1, _id: -1 }, { unique: true });
schema.index({ updatedAt: 1, _id: 1 }, { unique: true });
schema.index({ updatedAt: -1, _id: -1 }, { unique: true });

module.exports = schema;
