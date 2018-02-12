const mongoose = require('mongoose');

const { Schema } = mongoose;

module.exports = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true,
  },
  template: {
    type: String,
    required: true,
  },
  publisherId: {
    type: Schema.Types.ObjectId,
    required: true,
  },
}, { timestamps: true });
