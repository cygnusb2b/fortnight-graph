const { isURL } = require('validator');

const {
  cleanEnv,
  makeValidator,
  port,
  bool,
  str,
  url,
  json,
} = require('envalid');

const redisdsn = makeValidator((v) => {
  const opts = { protocols: ['redis'], require_tld: false, require_protocol: true };
  if (isURL(v, opts)) return v;
  throw new Error('Expected a Redis DSN string with redis://');
});

const nonemptystr = makeValidator((v) => {
  const err = new Error('Expected a non-empty string');
  if (v === undefined || v === null || v === '') {
    throw err;
  }
  const trimmed = String(v).trim();
  if (!trimmed) throw err;
  return trimmed;
});

module.exports = cleanEnv(process.env, {
  ACCOUNT_KEY: nonemptystr({ desc: 'The account/tenant key. Is used for querying the account information and settings from the core database connection.' }),
  AWS_ACCESS_KEY_ID: nonemptystr({ desc: 'The AWS access key value.' }),
  AWS_SECRET_ACCESS_KEY: nonemptystr({ desc: 'The AWS secret access key value.' }),
  S3_BUCKET: nonemptystr({ desc: 'The S3 bucket where images should be stored.', default: 'fortnight-materials' }),
  S3_OBJECT_ACL: nonemptystr({ desc: 'The ACL for S3 objects.', default: 'public-read' }),
  APP_HOST: nonemptystr({ desc: 'The hostname where the server instance is running.' }),
  STORY_HOST: nonemptystr({ desc: 'The hostname where the story website instance is running.' }),
  GA_TRACKING_ID: nonemptystr({ desc: 'The Google analytics ID that stories/sponsored content will use for tracking', default: 'UA-55543240-3', devDefault: 'UA-55543240-4' }),
  GA_VIEW_ID: nonemptystr({ desc: 'The Google analytics view ID that the API will use when querying data.', default: '178806143', devDefault: '190238860' }),
  GTM_CONTAINER_ID: nonemptystr({ desc: 'The Google Tag Manager container ID. This is global for the application _not_ the account level GTM ID', default: 'GTM-PVHD8N5' }),
  GOOGLE_SITE_VERIFICATION: str({ desc: 'The Google Webmaster Tools site verification meta value.', default: '' }),
  ELASTIC_HOST: url({ desc: 'The Elasticsearch DSN to connect to.' }),
  ELASTIC_INDEX_RECREATE: bool({ desc: 'Whether the Elasticsearch indexes should be re-created.', default: false }),
  IMGIX_URL: url({ desc: 'The Imgix URL for serving images.', default: 'https://fortnight.imgix.net' }),
  GOOGLE_APPLICATION_CREDENTIALS: json({ desc: 'The Google Cloud service account credentials.' }),
  MONGOOSE_DEBUG: bool({ desc: 'Whether to enable Mongoose debugging.', default: false }),
  MONGO_DSN: nonemptystr({ desc: 'The MongoDB DSN to connect to.' }),
  NEW_RELIC_ENABLED: bool({ desc: 'Whether New Relic is enabled.', default: true, devDefault: false }),
  NEW_RELIC_LICENSE_KEY: nonemptystr({ desc: 'The license key for New Relic.', devDefault: '(unset)' }),
  PORT: port({ desc: 'The port that express will run on.', default: 80 }),
  REDIS_DSN: redisdsn({ desc: 'The Redis DSN to connect to.' }),
  SENDGRID_API_KEY: nonemptystr({ desc: 'The SendGrid API key for sending email.' }),
  SENDGRID_FROM: nonemptystr({ desc: 'The from name to use when sending email via SendGrid, e.g. Foo <foo@bar.com>' }),
  TRUSTED_PROXIES: str({ desc: 'A comma seperated list of trusted proxy IP addresses.', default: '' }),
});
