const { Schema } = require('mongoose');
const validator = require('validator');
const connection = require('../mongoose');
const { applyElasticPlugin, setEntityFields } = require('../elastic/mongoose');

const schema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true,
  },
  logo: {
    type: String,
    required: false,
    trim: true,
    validate: {
      validator(v) {
        if (!v) return true;
        return validator.isURL(v, {
          protocols: ['https'],
          require_protocol: true,
        });
      },
      message: 'Invalid advertiser logo URL for {VALUE}',
    },
  },
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
