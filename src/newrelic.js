/* istanbul ignore next  */
if (process.env.NODE_ENV !== 'production') process.env.NEW_RELIC_ENABLED = false;

const newrelic = require('newrelic');

module.exports = newrelic;
