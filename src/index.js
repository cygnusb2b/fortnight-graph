require('dotenv').config();
require('./newrelic');

const pkg = require('../package.json');
const { app } = require('./server');

const { PORT } = process.env;

const server = app.listen(PORT);
process.stdout.write(`Express app '${pkg.name}' listening on port ${PORT}\n`);

module.exports = server;
