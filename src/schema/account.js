const { Schema } = require('mongoose');
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
  bcc: {
    type: String,
  },
  requiredCreatives: {
    type: Number,
    default: 1,
  },
  session: {
    type: sessionSchema,
    default() {
      return {};
    },
  },
  googleTagManagerId: String,
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

schema.virtual('uri').get(() => {
  const { APP_HOST, NODE_ENV } = env;
  const protocol = NODE_ENV === 'production' ? 'https' : 'http';
  return `${protocol}://${APP_HOST}`;
});

schema.virtual('storyUri').get(() => {
  const { STORY_HOST, NODE_ENV } = env;
  const protocol = NODE_ENV === 'production' ? 'https' : 'http';
  return `${protocol}://${STORY_HOST}`;
});

module.exports = schema;
