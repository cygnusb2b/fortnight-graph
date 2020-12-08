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
  fullName: {
    type: String,
    required: true,
    trim: true,
  },
  publisherName: {
    type: String,
  },
  deploymentName: {
    type: String,
  },
}, { timestamps: true });

setEntityFields(schema, 'name');
setEntityFields(schema, 'publisherName');
setEntityFields(schema, 'deploymentName');
applyElasticPlugin(schema, 'email-placements');

schema.plugin(referencePlugin, {
  name: 'deploymentId',
  connection,
  modelName: 'email-deployment',
  options: { required: true },
});
schema.plugin(deleteablePlugin, {
  es_indexed: true,
  es_type: 'boolean',
});
schema.plugin(userAttributionPlugin);
schema.plugin(repositoryPlugin);
schema.plugin(paginablePlugin);
schema.plugin(searchablePlugin, { fieldNames: ['name', 'publisherName', 'deploymentName'] });

schema.pre('validate', async function setDeploymentInfo() {
  if (this.isModified('deploymentId') || !this.deploymentName || this.isModified('publisherId') || !this.publisherName) {
    const deployment = await connection.model('email-deployment').findOne({ _id: this.deploymentId }, { name: 1, publisherName: 1 });
    this.deploymentName = deployment.name;
    this.publisherName = deployment.publisherName;
  }
});

schema.pre('validate', function setFullName() {
  const { name, deploymentName, publisherName } = this;
  this.fullName = `${publisherName} > ${deploymentName} > ${name}`;
});

schema.pre('save', async function checkDelete() {
  if (!this.isModified('deleted') || !this.deleted) return;
  const lineItems = await connection.model('email-line-item').countActive({ emailPlacementId: this.id });
  if (lineItems) throw new Error('You cannot delete a placement that has related email line items.');
});

schema.index({ deploymentId: 1, deleted: 1 });
schema.index({ name: 1, _id: 1 }, { unique: true });
schema.index({ updatedAt: 1, _id: 1 }, { unique: true });

module.exports = schema;
