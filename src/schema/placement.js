const mongoose = require('mongoose');
const Publisher = require('../models/publisher');

const { Schema } = mongoose;

const schema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true,
  },
  template: {
    type: String,
  },
  publisherId: {
    type: Schema.Types.ObjectId,
    required: true,
    validate: {
      async validator(v) {
        const doc = await Publisher.findOne({ _id: v }, { _id: 1 });
        if (doc) return true;
        return false;
      },
      message: 'No publisher found for ID {VALUE}',
    },
  },
}, { timestamps: true });

schema.index({ publisherId: 1 });

module.exports = schema;
