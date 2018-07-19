const { Schema } = require('mongoose');
const connection = require('../connections/mongoose/instance');
const { applyElasticPlugin, setEntityFields } = require('../elastic/mongoose');

const schema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  publisherId: {
    type: Schema.Types.ObjectId,
    required: true,
    es_indexed: true,
    es_type: 'keyword',
    validate: {
      async validator(v) {
        const doc = await connection.model('publisher').findOne({ _id: v }, { _id: 1 });
        if (doc) return true;
        return false;
      },
      message: 'No publisher found for ID {VALUE}',
    },
  },
  publisherName: {
    type: String,
  },
}, { timestamps: true });

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

setEntityFields(schema, 'name');
setEntityFields(schema, 'publisherName');
applyElasticPlugin(schema, 'topics');

schema.index({ publisherId: 1, name: 1 }, { unique: true });
schema.index({ name: 1, _id: 1 }, { unique: true });
schema.index({ name: -1, _id: -1 }, { unique: true });
schema.index({ updatedAt: 1, _id: 1 }, { unique: true });
schema.index({ updatedAt: -1, _id: -1 }, { unique: true });

module.exports = schema;