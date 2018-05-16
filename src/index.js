require('dotenv').config();
require('./newrelic');

const pkg = require('../package.json');
const { app } = require('./server');

const { PORT } = process.env;

const server = app.listen(PORT);

if (process.env.NODE_ENV !== 'test') {
  process.stdout.write(`Express app '${pkg.name}' listening on port ${PORT}\n`);
}

module.exports = server;
