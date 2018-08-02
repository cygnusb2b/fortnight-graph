const { Schema } = require('mongoose');
const { isFQDN } = require('validator');
const slug = require('slug');
const uuid = require('uuid/v4');
const pushId = require('unique-push-id');
const env = require('../env');
const { reservePctPlugin, repositoryPlugin } = require('../plugins');

const sessionSchema = new Schema({
  globalSecret: {
    type: String,
    default() {
      return `${pushId()}.${uuid()}`;
    },
  },
  namespace: {
    type: String,
    default() {
      return uuid();
    },
  },
  expiration: {
    type: Number,
    default: 86400,
    min: 10,
    max: 31536000,
  },
});

const settingsSchema = new Schema({
  cname: {
    type: String,
    trim: true,
    validate: {
      validator(v) {
        if (!v) return true;
        return isFQDN(String(v));
      },
      message: 'Invalid domain name: {VALUE}',
    },
  },
  bcc: {
    type: String,
  },
  session: {
    type: sessionSchema,
    default() {
      return {};
    },
  },
});

settingsSchema.plugin(reservePctPlugin);

const schema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  key: {
    type: String,
    maxlength: 54,
    lowercase: true,
    unique: true,
    set(v) {
      return slug(v);
    },
  },
  settings: {
    type: settingsSchema,
    default() {
      return {};
    },
  },
}, { timestamps: true });

schema.plugin(repositoryPlugin);

schema.virtual('uri').get(function getUrl() {
  const { BASE_URI, NODE_ENV } = env;
  const protocol = NODE_ENV === 'production' ? 'https' : 'http';
  return `${protocol}://${this.key}.${BASE_URI}`;
});

module.exports = schema;
