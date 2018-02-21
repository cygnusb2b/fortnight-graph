const { Schema } = require('mongoose');

module.exports = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true,
  },
  html: {
    type: String,
    required: true,
  },
  fallback: {
    type: String,
  },
}, { timestamps: true });
