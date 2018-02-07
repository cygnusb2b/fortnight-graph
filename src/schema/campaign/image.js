const mongoose = require('mongoose');
const validator = require('validator');

const { Schema } = mongoose;

const schema = new Schema({
  src: {
    type: String,
    required: true,
    trim: true,
    validate: [
      {
        validator(value) {
          return validator.isURL(value, { protocols: ['https'], require_protocol: true });
        },
      },
    ],
  },
  filePath: {
    type: String,
    required: true,
    trim: true,
  },
  mimeType: {
    type: String,
    trim: true,
    validate: [
      {
        validator(value) {
          return validator.isMimeType(value);
        },
      },
    ],
  },
  fileSize: {
    type: Number,
    min: 0,
  },
  width: {
    type: Number,
    min: 0,
  },
  height: {
    type: Number,
    min: 0,
  },
  focalPoint: {
    x: {
      type: Number,
      required: true,
      min: 0,
      max: 1,
    },
    y: {
      type: Number,
      required: true,
      min: 0,
      max: 1,
    },
  },
});


schema.pre('validate', function sanitizeFilePath(next) {
  if (!this.isModified('filePath')) {
    next();
  } else {
    this.filePath = validator.trim(this.filePath, ' /');
    next();
  }
});

module.exports = schema;
