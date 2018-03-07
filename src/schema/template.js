const { Schema } = require('mongoose');

const validateBeacon = (v) => {
  if (!v) return v;
  const results = v.match(/{{\s*?beacon\s*?}}/g);
  if (!results) return false;
  if (results.length > 1) return false;
  return true;
};

const schema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true,
  },
  html: {
    type: String,
    required: true,
    validate: [
      {
        validator(v) {
          return validateBeacon(v);
        },
        message: 'The {{ beacon }} merge variable must be present, exactly one time.',
      },
    ],
  },
  fallback: {
    type: String,
    validate: {
      validator(v) {
        return validateBeacon(v);
      },
      message: 'The {{ beacon }} merge variable must be present, exactly one time.',
    },
  },
}, { timestamps: true });

schema.index({ name: 1, _id: 1 }, { unique: true });
schema.index({ name: -1, _id: -1 }, { unique: true });
schema.index({ updatedAt: 1, _id: 1 }, { unique: true });
schema.index({ updatedAt: -1, _id: -1 }, { unique: true });

module.exports = schema;
