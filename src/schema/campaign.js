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
  status: {
    type: String,
    required: true,
    default: 'draft',
  },
  creatives: [{
    name: {
      type: String,
      required: false,
      trim: true,
    },
    url: {
      type: String,
      required: false,
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
  }],
}, { timestamps: true });
