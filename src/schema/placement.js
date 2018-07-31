const { Schema } = require('mongoose');
const connection = require('../connections/mongoose/instance');
const { applyElasticPlugin, setEntityFields } = require('../elastic/mongoose');
const {
  deleteablePlugin,
  paginablePlugin,
  referencePlugin,
  repositoryPlugin,
  searchablePlugin,
  reservePctPlugin,
} = require('../plugins');

const schema = new Schema({
  name: {
    type: String,
    trim: true,
  },
  publisherName: {
    type: String,
  },
  topicName: {
    type: String,
  },
  templateName: {
    type: String,
  },
}, { timestamps: true });

setEntityFields(schema, 'name');
setEntityFields(schema, 'publisherName');
setEntityFields(schema, 'topicName');
setEntityFields(schema, 'templateName');
applyElasticPlugin(schema, 'placements');

schema.plugin(referencePlugin, {
  name: 'publisherId',
  connection,
  modelName: 'publisher',
  options: { required: true },
});
schema.plugin(referencePlugin, {
  name: 'templateId',
  connection,
  modelName: 'template',
  options: { required: true },
});
schema.plugin(referencePlugin, {
  name: 'topicId',
  connection,
  modelName: 'topic',
});
schema.plugin(deleteablePlugin, {
  es_indexed: true,
  es_type: 'boolean',
});
schema.plugin(repositoryPlugin);
schema.plugin(paginablePlugin);
schema.plugin(reservePctPlugin);
schema.plugin(searchablePlugin, { fieldNames: ['name', 'publisherName', 'topicName', 'templateName'] });

schema.pre('save', async function setPublisherName() {
  if (this.isModified('publisherId') || !this.publisherName) {
    const publisher = await connection.model('publisher').findOne({ _id: this.publisherId }, { name: 1 });
    this.publisherName = publisher.name;
  }
});

schema.pre('save', async function setTemplateName() {
  if (this.isModified('templateId') || !this.templateName) {
    const template = await connection.model('template').findOne({ _id: this.templateId }, { name: 1 });
    this.templateName = template.name;
  }
});

schema.pre('save', async function setTopicName() {
  if (this.isModified('topicId') && this.topicId) {
    const topic = await connection.model('topic').findOne({ _id: this.topicId }, { name: 1 });
    this.topicName = topic.name;
  }
});

schema.index({ publisherId: 1, templateId: 1, topicId: 1 }, { unique: true });
schema.index({ name: 1, _id: 1 }, { unique: true });
schema.index({ name: -1, _id: -1 }, { unique: true });
schema.index({ updatedAt: 1, _id: 1 }, { unique: true });
schema.index({ updatedAt: -1, _id: -1 }, { unique: true });

module.exports = schema;
