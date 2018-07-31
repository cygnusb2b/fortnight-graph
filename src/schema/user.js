const bcrypt = require('bcrypt');
const { Schema } = require('mongoose');
const validator = require('validator');
const crypto = require('crypto');
const { applyElasticPlugin, setEntityFields } = require('../elastic/mongoose');
const {
  deleteablePlugin,
  paginablePlugin,
  repositoryPlugin,
  searchablePlugin,
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
  givenName: {
    type: String,
    required: true,
    trim: true,
  },
  familyName: {
    type: String,
    required: true,
    trim: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
  },
  logins: {
    type: Number,
    default: 0,
    min: 0,
  },
  lastLoggedInAt: {
    type: Date,
  },
  isEmailVerified: {
    type: Boolean,
    required: true,
    default: false,
  },
  role: {
    type: String,
    default: 'Member',
    required: true,
    enum: ['Member', 'Admin'],
  },
  photoURL: {
    type: String,
    trim: true,
    validate: {
      validator(v) {
        if (!v) return true;
        return validator.isURL(v, {
          protocols: ['http', 'https'],
          require_protocol: true,
        });
      },
      message: 'Invalid photo URL for {VALUE}',
    },
  },
}, {
  timestamps: true,
});

setEntityFields(schema, 'name');
applyElasticPlugin(schema, 'users');

schema.plugin(deleteablePlugin, {
  es_indexed: true,
  es_type: 'boolean',
});
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

/**
 * Indexes
 */
schema.index({ email: 1, isEmailVerified: 1 });
schema.index({ email: 1, deleted: 1 }, { unique: true });

/**
 * Hooks.
 */
schema.pre('validate', function setName(next) {
  this.name = `${this.givenName} ${this.familyName}`;
  next();
});

schema.pre('save', function setPassword(next) {
  if (!this.isModified('password') || this.password.match(/^\$2[ayb]\$.{56}$/)) {
    next();
  } else {
    bcrypt.hash(this.password, 13).then((hash) => {
      this.password = hash;
      next();
    }).catch(next);
  }
});

schema.pre('save', function setPhotoURL(next) {
  if (!this.photoURL) {
    const hash = crypto.createHash('md5').update(this.email).digest('hex');
    this.photoURL = `https://www.gravatar.com/avatar/${hash}`;
  }
  next();
});

module.exports = schema;
