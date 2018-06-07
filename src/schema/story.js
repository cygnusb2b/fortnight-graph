const { Schema } = require('mongoose');

const schema = new Schema({
  name: {
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
    required: true,
    trim: true,
  },
}, { timestamps: true });

module.exports = schema;
