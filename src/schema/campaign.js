const mongoose = require('mongoose');
const shortid = require('shortid');

const { Schema } = mongoose;

module.exports = new Schema({
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
  deleted: {
    type: Boolean,
    required: true,
    default: false
  },
  draft: {
    type: Boolean,
    required: true,
    default: true
  },
  paused: {
    type: Boolean,
    required: true,
    default: false
  },
  creatives: [{
    id: {
      type: String,
      required: true,
      default: shortid.generate,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    url: {
      type: String,
      required: true,
      trim: true,
    },
    title: {
      type: String,
      required: false,
      trim: true,
    },
    teaser: {
      type: String,
      required: false,
      trim: true,
    },
    image: {
      type: String,
      required: false,
      trim: true,
    },
  }]
}, { timestamps: true });
