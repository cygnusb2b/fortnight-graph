const { Schema } = require('mongoose');
const validator = require('validator');
const { applyElasticPlugin, setEntityFields } = require('../elastic/mongoose');

const schema = new Schema({
  email: {
    type: String,
    required: true,
    trim: true,
    unique: true,
    lowercase: true,
    validate: [
      {
        validator(email) {
          return validator.isEmail(email);
        },
        message: 'Invalid email address {VALUE}',
      },
    ],
    es_indexed: true,
    es_type: 'text',
    es_analyzer: 'email_address',
    es_fields: {
      raw: {
        type: 'keyword',
      },
      edge: {
        type: 'text',
        analyzer: 'email_address_starts_with',
        search_analyzer: 'email_address',
      },
    },
  },
  name: {
    type: String,
    required: false,
    trim: true,
  },
  givenName: {
    type: String,
    required: false,
    trim: true,
  },
  familyName: {
    type: String,
    required: false,
    trim: true,
  },
}, {
  timestamps: true,
});

schema.pre('save', function setName(next) {
  this.name = `${this.givenName} ${this.familyName}`;
  next();
});

setEntityFields(schema, 'name');
applyElasticPlugin(schema, 'contacts');

schema.index({ name: 1, _id: 1 }, { unique: true });
schema.index({ name: -1, _id: -1 }, { unique: true });
schema.index({ updatedAt: 1, _id: 1 }, { unique: true });
schema.index({ updatedAt: -1, _id: -1 }, { unique: true });

module.exports = schema;
