require('./newrelic');
require('./datadog');

const env = require('./env');
const output = require('./output');
const pkg = require('../package.json');
const { app } = require('./server');

const { PORT } = env;

const server = app.listen(PORT);
output.write(`🕸️ 🕸️ 🕸️ Express app '${pkg.name}:v${pkg.version}' listening on port ${PORT}`);

module.exports = server;
