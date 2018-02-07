const mongoose = require('mongoose');
const shortid = require('shortid');
const CreativeSchema = require('./creative');

const { Schema } = mongoose;

const schema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  cid: {
    type: String,
    required: true,
    unique: true,
    default: shortid.generate,
  },
  advertiserId: {
    type: Schema.Types.ObjectId,
    required: true,
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
  },
  creatives: [CreativeSchema],
}, { timestamps: true });

schema.index({ name: 1, _id: 1 }, { unique: true });
schema.index({ name: -1, _id: -1 }, { unique: true });
schema.index({ updatedAt: 1, _id: 1 }, { unique: true });
schema.index({ updatedAt: -1, _id: -1 }, { unique: true });

module.exports = schema;
