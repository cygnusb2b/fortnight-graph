const { Schema } = require('mongoose');

const { IMGIX_URL } = process.env;

const focalPointSchema = new Schema({
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
});

const schema = new Schema({
  filename: {
    type: String,
    trim: true,
    required: true,
    set(v) {
      // Ensure the filename is always decoded.
      return decodeURIComponent(v);
    },
    get(v) {
      // Ensure the filename is always decoded.
      return decodeURIComponent(v);
    },
  },
  s3: {
    bucket: String,
    location: String,
  },
  uploadedAt: {
    type: Date,
  },
  mimeType: {
    type: String,
    enum: ['image/jpeg', 'image/png', 'image/webm', 'image/gif'],
  },
  size: {
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
  focalPoint: focalPointSchema,
});

schema.virtual('key').get(function getKey() {
  // The S3 bucket key. Generated from the image id and filename.
  return `${this.id}/${this.filename}`;
});

schema.virtual('src').get(function src() {
  // The image src, for use with `img` elements.
  // Generated from the imgix url, the id, and the encoded filename.
  return `${IMGIX_URL}/${this.id}/${encodeURIComponent(this.filename)}`;
});

module.exports = schema;
