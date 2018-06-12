const { Schema } = require('mongoose');
const connection = require('../mongoose');
const { applyElasticPlugin, setEntityFields } = require('../elastic/mongoose');
const imageSchema = require('./image');

const schema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true,
  },
  logo: imageSchema,
}, { timestamps: true });

schema.pre('save', async function updatePlacements() {
  if (this.isModified('name')) {
    // This isn't as efficient as calling `updateMany`, but the ElasticSearch
    // plugin will not fire properly otherwise.
    // As such, do not await the update.
    const Placement = connection.model('placement');
    const docs = await Placement.find({ publisherId: this.id });
    docs.forEach((doc) => {
      doc.set('publisherName', this.name);
      doc.save();
    });
  }
});

setEntityFields(schema, 'name');
applyElasticPlugin(schema, 'publishers');

schema.index({ name: 1, _id: 1 }, { unique: true });
schema.index({ name: -1, _id: -1 }, { unique: true });
schema.index({ updatedAt: 1, _id: 1 }, { unique: true });
schema.index({ updatedAt: -1, _id: -1 }, { unique: true });

module.exports = schema;
