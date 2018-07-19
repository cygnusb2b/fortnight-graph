const { Schema } = require('mongoose');
const connection = require('../connections/mongoose/instance');
const { applyElasticPlugin, setEntityFields } = require('../elastic/mongoose');

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
  publisherId: {
    type: Schema.Types.ObjectId,
    required: true,
    validate: {
      async validator(v) {
        const doc = await connection.model('publisher').findOne({ _id: v }, { _id: 1 });
        if (doc) return true;
        return false;
      },
      message: 'No publisher found for ID {VALUE}',
    },
  },
  templateId: {
    type: Schema.Types.ObjectId,
    required: true,
    validate: {
      async validator(v) {
        const doc = await connection.model('template').findOne({ _id: v }, { _id: 1 });
        if (doc) return true;
        return false;
      },
      message: 'No template found for ID {VALUE}',
    },
  },
  topicId: {
    type: Schema.Types.ObjectId,
    validate: {
      async validator(v) {
        const doc = await connection.model('topic').findOne({ _id: v }, { _id: 1 });
        if (doc) return true;
        return false;
      },
      message: 'No template found for ID {VALUE}',
    },
  },
}, { timestamps: true });

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

setEntityFields(schema, 'name');
setEntityFields(schema, 'publisherName');
setEntityFields(schema, 'topicName');
setEntityFields(schema, 'templateName');
applyElasticPlugin(schema, 'placements');

schema.index({ publisherId: 1, templateId: 1, topicId: 1 }, { unique: true });
schema.index({ name: 1, _id: 1 }, { unique: true });
schema.index({ name: -1, _id: -1 }, { unique: true });
schema.index({ updatedAt: 1, _id: 1 }, { unique: true });
schema.index({ updatedAt: -1, _id: -1 }, { unique: true });

module.exports = schema;
