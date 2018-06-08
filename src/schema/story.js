const { Schema } = require('mongoose');
const connection = require('../mongoose');
const { applyElasticPlugin, setEntityFields } = require('../elastic/mongoose');

const schema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  teaser: {
    type: String,
    trim: true,
  },
  body: {
    type: String,
    trim: true,
  },
  advertiserId: {
    type: Schema.Types.ObjectId,
    required: true,
    validate: {
      async validator(v) {
        const doc = await connection.model('advertiser').findOne({ _id: v }, { _id: 1 });
        if (doc) return true;
        return false;
      },
      message: 'No advertiser found for ID {VALUE}',
    },
  },
  advertiserName: {
    type: String,
  },
  publishedAt: {
    type: Date,
  },
}, { timestamps: true });

schema.pre('save', async function setAdvertiserName() {
  if (this.isModified('advertiserId') || !this.advertiserName) {
    const advertiser = await connection.model('advertiser').findOne({ _id: this.advertiserId }, { name: 1 });
    this.advertiserName = advertiser.name;
  }
});

setEntityFields(schema, 'title');
setEntityFields(schema, 'advertiserName');
applyElasticPlugin(schema, 'stories');

schema.index({ advertiserId: 1 });
schema.index({ title: 1, _id: 1 }, { unique: true });
schema.index({ title: -1, _id: -1 }, { unique: true });
schema.index({ updatedAt: 1, _id: 1 }, { unique: true });
schema.index({ updatedAt: -1, _id: -1 }, { unique: true });
schema.index({ publishedAt: 1, _id: 1 }, { unique: true });
schema.index({ publishedAt: -1, _id: -1 }, { unique: true });

module.exports = schema;
