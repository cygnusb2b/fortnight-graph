const { Schema } = require('mongoose');
const slug = require('slug');

const schema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  key: {
    type: String,
    maxlength: 54,
    lowercase: true,
    unique: true,
    set(v) {
      return slug(v);
    },
  },
}, { timestamps: true });

module.exports = schema;
