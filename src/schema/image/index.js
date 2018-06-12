const { Schema } = require('mongoose');
const validator = require('validator');
const FocalPointSchema = require('./focal-point');

const { IMGIX_URL } = process.env;

const schema = new Schema({
  filePath: {
    type: String,
    required: true,
    trim: true,
    set(value) {
      if (!value) return value;
      return validator.trim(value, ' /');
    },
  },
  mimeType: {
    type: String,
    enum: ['image/jpeg', 'image/png', 'image/webm', 'image/gif'],
  },
  fileSize: {
    type: Number,
    min: 0,
  },
  width: {
    type: Number,
    min: 0,
    max: 32768,
  },
  height: {
    type: Number,
    min: 0,
    max: 32768,
  },
  focalPoint: FocalPointSchema,
});

schema.virtual('src').get(function src() {
  return `${IMGIX_URL}/${this.filePath}`;
});

module.exports = schema;
