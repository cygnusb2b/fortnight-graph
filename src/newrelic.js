const env = require('./env');

process.env.NEW_RELIC_ENABLED = env.NEW_RELIC_ENABLED;

module.exports = require('newrelic');
