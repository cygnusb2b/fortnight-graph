const mongoose = require('mongoose');

const { Schema } = mongoose;

module.exports = new Schema({
  src: {
    type: String,
    required: true,
  },
  filePath: {
    type: String,
    required: true,
  },
  mimeType: {
    type: String,
  },
  filesize: {
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
