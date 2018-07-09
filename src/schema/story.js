const { Schema } = require('mongoose');
const slug = require('slug');
const connection = require('../connections/mongoose/instance');
const { applyElasticPlugin, setEntityFields } = require('../elastic/mongoose');
const imagePlugin = require('../plugins/image');
const userAttributionPlugin = require('../plugins/user-attribution');

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
  disposition: {
    type: String,
    required: true,
    default: 'Draft',
    enum: ['Placeholder', 'Draft', 'Deleted', 'Ready'],
  },
  publishedAt: {
    type: Date,
  },
}, { timestamps: true });

schema.plugin(userAttributionPlugin);

imagePlugin(schema, { fieldName: 'primaryImageId' });
imagePlugin(schema, { fieldName: 'imageIds', multiple: true });

schema.virtual('slug').get(function getSlug() {
  return slug(this.title).toLowerCase();
});

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
schema.index({ disposition: 1 });
schema.index({ title: 1, _id: 1 }, { unique: true });
schema.index({ title: -1, _id: -1 }, { unique: true });
schema.index({ updatedAt: 1, _id: 1 }, { unique: true });
schema.index({ updatedAt: -1, _id: -1 }, { unique: true });
schema.index({ publishedAt: 1, _id: 1 }, { unique: true });
schema.index({ publishedAt: -1, _id: -1 }, { unique: true });

module.exports = schema;
