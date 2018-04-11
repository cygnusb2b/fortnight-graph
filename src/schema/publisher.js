const { Schema } = require('mongoose');
const validator = require('validator');

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
      message: 'Invalid publisher logo URL for {VALUE}',
    },
  },
}, { timestamps: true });

schema.index({ name: 1, _id: 1 }, { unique: true });
schema.index({ name: -1, _id: -1 }, { unique: true });
schema.index({ updatedAt: 1, _id: 1 }, { unique: true });
schema.index({ updatedAt: -1, _id: -1 }, { unique: true });

module.exports = schema;
