const mongoose = require('mongoose');
const validator = require('validator');
const CreativeSchema = require('./creative');
const CriteriaSchema = require('./criteria');
const Advertiser = require('../../models/advertiser');

const { Schema } = mongoose;

const schema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
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
}, { timestamps: true });

schema.index({ advertiserId: 1 });
schema.index({ name: 1, _id: 1 }, { unique: true });
schema.index({ name: -1, _id: -1 }, { unique: true });
schema.index({ updatedAt: 1, _id: 1 }, { unique: true });
schema.index({ updatedAt: -1, _id: -1 }, { unique: true });

module.exports = schema;
