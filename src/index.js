require('dotenv').config();

/* eslint-disable global-require */
if (process.env.NEW_RELIC_LICENSE_KEY) {
  require('newrelic');
}
/* eslint-enable global-require */

const pkg = require('../package.json');
const { app } = require('./server');

const { PORT } = process.env;

const server = app.listen(PORT);
process.stdout.write(`Express app '${pkg.name}' listening on port ${PORT}\n`);

module.exports = server;
