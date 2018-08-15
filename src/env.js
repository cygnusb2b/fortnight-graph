const { isURL } = require('validator');
const { readFileSync } = require('fs');

const {
  cleanEnv,
  makeValidator,
  port,
  bool,
  url,
} = require('envalid');

const mongodsn = makeValidator((v) => {
  const opts = { protocols: ['mongodb'], require_tld: false, require_protocol: true };
  if (isURL(v, opts)) return v;
  throw new Error('Expected a Mongo DSN string with mongodb://');
});

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

const jsonfile = makeValidator((v) => {
  if (!v) throw new Error('Expected a non-empty string');
  try {
    const data = readFileSync(v, { encoding: 'utf8', flag: 'r' });
    return JSON.parse(data);
  } catch (e) {
    throw new Error(`Invalid jsonfile: ${e.message}`);
  }
});

module.exports = cleanEnv(process.env, {
  ACCOUNT_KEY: nonemptystr({ desc: 'The account/tenant key. Is used for querying the account information and settings from the core database connection.' }),
  AWS_ACCESS_KEY_ID: nonemptystr({ desc: 'The AWS access key value.' }),
  AWS_SECRET_ACCESS_KEY: nonemptystr({ desc: 'The AWS secret access key value.' }),
  APP_HOST: nonemptystr({ desc: 'The hostname where the server instance is running.' }),
  STORY_HOST: nonemptystr({ desc: 'The hostname where the story website instance is running.' }),
  GA_TRACKING_ID: nonemptystr({ desc: 'The Google analytics ID that stories/sponsored content will use for tracking' }),
  ELASTIC_HOST: url({ desc: 'The Elasticsearch DSN to connect to.' }),
  ELASTIC_INDEX_RECREATE: bool({ desc: 'Whether the Elasticsearch indexes should be re-created.', default: false }),
  IMGIX_URL: url({ desc: 'The Imgix URL for serving images.' }),
  GOOGLE_APPLICATION_CREDENTIALS: jsonfile({ desc: 'The location of the Google Cloud service account credentials file.' }),
  MONGOOSE_DEBUG: bool({ desc: 'Whether to enable Mongoose debugging.', default: false }),
  MONGO_DSN: mongodsn({ desc: 'The MongoDB DSN to connect to.' }),
  NEW_RELIC_ENABLED: bool({ desc: 'Whether New Relic is enabled.', default: true, devDefault: false }),
  NEW_RELIC_LICENSE_KEY: nonemptystr({ desc: 'The license key for New Relic.', devDefault: '(unset)' }),
  DD_ENABLED: bool({ desc: 'Whether Datadog is enabled.', default: true, devDefault: false }),
  DD_TRACE_DEBUG: bool({ desc: 'Whether Datadog is enabled.', default: true, devDefault: false }),
  DD_SERVICE_NAME: nonemptystr({ desc: 'The Datadog service name', default: 'nativex-graph' }),
  DD_TRACE_AGENT_HOSTNAME: nonemptystr({ desc: 'The Datadog agent hostname', devDefault: 'datadog-agent' }),
  DD_TRACE_AGENT_PORT: port({ desc: 'The Datadog agent port', default: 8126 }),
  DD_ENV: nonemptystr({ desc: 'The Datadog environment key', default: process.env.NODE_ENV }),
  PORT: port({ desc: 'The port that express will run on.', default: 8100 }),
  REDIS_DSN: redisdsn({ desc: 'The Redis DSN to connect to.' }),
  SENDGRID_API_KEY: nonemptystr({ desc: 'The SendGrid API key for sending email.' }),
  SENDGRID_FROM: nonemptystr({ desc: 'The from name to use when sending email via SendGrid, e.g. Foo <foo@bar.com>' }),
});

