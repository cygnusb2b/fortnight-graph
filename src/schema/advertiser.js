const mongoose = require('mongoose');
const notifyPlugin = require('../plugins/notify');
const validator = require('validator');
const applyElastic = require('../elastic/mongoose');

const { Schema } = mongoose;

const schema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true,
    es_indexed: true,
    es_type: 'text',
    es_analyzer: 'default',
    es_fields: {
      edge: {
        type: 'text',
        analyzer: 'entity_starts_with',
        search_analyzer: 'entity_starts_with_search',
      },
      ngram: {
        type: 'text',
        analyzer: 'entity_tri_gram',
      },
      phonetic: {
        type: 'text',
        analyzer: 'entity_sounds_like',
      },
    },
  },
  logo: {
    type: String,
    required: false,
    trim: true,
    validate: {
      validator(v) {
        if (!v) return true;
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
applyElastic(schema);

schema.index({ name: 1, _id: 1 }, { unique: true });
schema.index({ name: -1, _id: -1 }, { unique: true });
schema.index({ updatedAt: 1, _id: 1 }, { unique: true });
schema.index({ updatedAt: -1, _id: -1 }, { unique: true });

module.exports = schema;
