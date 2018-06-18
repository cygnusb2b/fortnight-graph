const { Schema } = require('mongoose');
const slug = require('slug');
const uuid = require('uuid/v4');
const pushId = require('unique-push-id');

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

schema.virtual('uri').get(function getUrl() {
  const { BASE_URI, NODE_ENV } = process.env;
  const protocol = NODE_ENV === 'production' ? 'https' : 'http';
  return `${protocol}://${this.key}.${BASE_URI}`;
});

module.exports = schema;
