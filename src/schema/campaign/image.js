const { Schema } = require('mongoose');
const validator = require('validator');
const FocalPointSchema = require('./image-focal-point');

module.exports = new Schema({
  src: {
    type: String,
    required: true,
    trim: true,
    validate: [
      {
        validator(value) {
          return validator.isURL(value, { protocols: ['https'], require_protocol: true });
        },
        message: 'Invalid image source URL {VALUE}',
      },
    ],
  },
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
