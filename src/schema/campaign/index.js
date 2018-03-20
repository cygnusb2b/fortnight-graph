const mongoose = require('mongoose');
const validator = require('validator');
const CreativeSchema = require('./creative');
const CriteriaSchema = require('./criteria');
const EmailNotificationSchema = require('./notify');
const Advertiser = require('../../models/advertiser');
const uuid = require('uuid/v4');
const uuidParse = require('uuid-parse');

const { Schema } = mongoose;

const schema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  hash: {
    type: String,
    required: true,
    default: uuid(),
    validate: {
      validator(v) {
        return v === uuidParse.unparse(uuidParse.parse(v));
      },
      message: 'Invalid campaign hash for {VALUE}',
    },
  },
  advertiserId: {
    type: Schema.Types.ObjectId,
    required: true,
    validate: {
      async validator(v) {
        const doc = await Advertiser.findOne({ _id: v }, { _id: 1 });
        if (doc) return true;
        return false;
      },
      message: 'No advertiser found for ID {VALUE}',
    },
  },
  status: {
    type: String,
    required: true,
    default: 'Draft',
    enum: [
      'Active',
      'Paused',
      'Draft',
      'Deleted',
    ],
  },
  url: {
    type: String,
    trim: true,
    required: true,
    validate: {
      validator(v) {
        return validator.isURL(v, {
          protocols: ['http', 'https'],
          require_protocol: true,
        });
      },
      message: 'Invalid campaign URL for {VALUE}',
    },
  },
  creatives: [CreativeSchema],
  criteria: CriteriaSchema,
  externalLinks: [{
    label: {
      type: String,
      required: false,
    },
    url: {
      type: String,
      required: true,
      validate: {
        validator(v) {
          return validator.isURL(v, {
            protocols: ['http', 'https'],
            require_protocol: true,
          });
        },
        message: 'Invalid external link URL for {VALUE}',
      },
    },
  }],
  notify: {
    internal: [EmailNotificationSchema],
    external: [EmailNotificationSchema],
  },
}, { timestamps: true });

schema.index({ hash: 1 });
schema.index({ advertiserId: 1 });
schema.index({ name: 1, _id: 1 }, { unique: true });
schema.index({ name: -1, _id: -1 }, { unique: true });
schema.index({ updatedAt: 1, _id: 1 }, { unique: true });
schema.index({ updatedAt: -1, _id: -1 }, { unique: true });

// Query logic for campaign retrieval.
schema.index({
  status: 1,
  'criteria.start': 1,
  'criteria.placementIds': 1,
  'criteria.end': 1,
});

module.exports = schema;
