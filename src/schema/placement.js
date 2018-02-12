const mongoose = require('mongoose');
const Publisher = require('../models/publisher');

const { Schema } = mongoose;

module.exports = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true,
  },
  template: {
    type: String,
    required: true,
  },
  publisherId: {
    type: Schema.Types.ObjectId,
    required: true,
    validate: {
      async validator(v) {
        if (!this.isModified('publisherId')) return true;
        const doc = await Publisher.findOne({ _id: v });
        if (doc) return true;
        return false;
      },
      message: 'No publisher found for ID {VALUE}',
    },
  },
}, { timestamps: true });
