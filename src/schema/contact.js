const { Schema } = require('mongoose');
const validator = require('validator');
const connection = require('../connections/mongoose/instance');
const { applyElasticPlugin, setEntityFields } = require('../elastic/mongoose');
const {
  deleteablePlugin,
  paginablePlugin,
  repositoryPlugin,
  searchablePlugin,
  userAttributionPlugin,
} = require('../plugins');

const schema = new Schema({
  email: {
    type: String,
    required: true,
    trim: true,
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

schema.plugin(deleteablePlugin, {
  es_indexed: true,
  es_type: 'boolean',
});
schema.plugin(repositoryPlugin);
schema.plugin(paginablePlugin);
schema.plugin(userAttributionPlugin);
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

schema.pre('validate', function setName(next) {
  this.name = `${this.givenName} ${this.familyName}`;
  next();
});

const removeContactsFor = async (modelType, contactId) => {
  const docs = await connection.model(modelType).find({
    $or: [
      { 'notify.internal': contactId },
      { 'notify.external': contactId },
    ],
  });
  return Promise.all(docs.map((doc) => {
    doc.removeContactIdAll(contactId);
    return doc.save();
  }));
};

schema.pre('save', async function removeRelsOnDelete() {
  if (!this.isModified('deleted') || !this.deleted) return;

  await Promise.all([
    removeContactsFor('advertiser', this.id),
    removeContactsFor('campaign', this.id),
  ]);
});

schema.statics.getOrCreateFor = async function getOrCreateFor({
  id,
  email,
  givenName,
  familyName,
}) {
  const existing = await this.findOne({ email });
  if (existing) return existing;
  return this.create({
    givenName,
    familyName,
    email,
    createdById: id,
    updatedById: id,
  });
};

schema.index({ email: 1, deleted: 1 }, { unique: true });
schema.index({ name: 1, _id: 1 }, { unique: true });
schema.index({ name: -1, _id: -1 }, { unique: true });
schema.index({ updatedAt: 1, _id: 1 }, { unique: true });
schema.index({ updatedAt: -1, _id: -1 }, { unique: true });

module.exports = schema;
