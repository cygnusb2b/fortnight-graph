const mongoose = require('mongoose');
const notifyPlugin = require('../plugins/notify');
const validator = require('validator');

const { Schema } = mongoose;

const schema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true,
  },
  logo: {
    type: String,
    required: false,
    validate: {
      validator(v) {
        return validator.isURL(v, {
          protocols: ['https'],
          require_protocol: true,
        });
      },
      message: 'Invalid advertiser logo URL for {VALUE}',
    },
  },
}, { timestamps: true });

schema.plugin(notifyPlugin);

schema.index({ name: 1, _id: 1 }, { unique: true });
schema.index({ name: -1, _id: -1 }, { unique: true });
schema.index({ updatedAt: 1, _id: 1 }, { unique: true });
schema.index({ updatedAt: -1, _id: -1 }, { unique: true });

module.exports = schema;
