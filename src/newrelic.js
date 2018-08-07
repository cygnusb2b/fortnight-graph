const env = require('./env');

process.env.NEW_RELIC_ENABLED = env.NEW_RELIC_ENABLED;
process.env.NEW_RELIC_APP_NAME = env.NEW_RELIC_APP_NAME;

module.exports = require('newrelic');
