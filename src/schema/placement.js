const mongoose = require('mongoose');
const shortid = require('shortid');

const { Schema } = mongoose;

module.exports = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  pid: {
    type: String,
    required: true,
    unique: true,
    default: shortid.generate,
  },
  template: {
    type: String,
    required: true,
  },
  publisherId: {
    type: Schema.Types.ObjectId,
    required: true,
  },
});
