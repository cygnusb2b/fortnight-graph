const { Schema } = require('mongoose');
const validator = require('validator');
const { applyElasticPlugin, setEntityFields } = require('../elastic/mongoose');
const {
  paginablePlugin,
  repositoryPlugin,
  searchablePlugin,
} = require('../plugins');

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

setEntityFields(schema, 'name');
applyElasticPlugin(schema, 'contacts');

schema.plugin(repositoryPlugin);
schema.plugin(paginablePlugin);
schema.plugin(searchablePlugin, {
  fieldNames: ['name'],
  beforeSearch: (query, phrase) => {
    const { should } = query.bool;
    should.push({ match: { email: { query: phrase, boost: 5 } } });
    should.push({ match: { 'email.edge': { query: phrase, operator: 'and', boost: 2 } } });
    should.push({ match: { 'email.edge': { query: phrase, boost: 1 } } });
  },
  beforeAutocomplete: (query, phrase) => {
    const { should } = query.bool;
    should.push({ match: { 'email.edge': { query: phrase, operator: 'and', boost: 2 } } });
    should.push({ match: { 'email.edge': { query: phrase, boost: 1 } } });
  },
});

schema.pre('save', function setName(next) {
  this.name = `${this.givenName} ${this.familyName}`;
  next();
});

schema.statics.getOrCreateFor = async function getOrCreateFor({ email, givenName, familyName }) {
  const existing = await this.findOne({ email });
  if (existing) return existing;
  return this.create({ givenName, familyName, email });
};

schema.index({ name: 1, _id: 1 }, { unique: true });
schema.index({ name: -1, _id: -1 }, { unique: true });
schema.index({ updatedAt: 1, _id: 1 }, { unique: true });
schema.index({ updatedAt: -1, _id: -1 }, { unique: true });

module.exports = schema;
