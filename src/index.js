require('./newrelic');

const env = require('./env');
const output = require('./output');
const pkg = require('../package.json');
const { app } = require('./server');
const contactNotifier = require('./services/contact-notifier');

const { PORT } = env;

const server = app.listen(PORT);
output.write(`🕸️ 🕸️ 🕸️ Express app '${pkg.name}' listening on port ${PORT}`);

contactNotifier.init();

module.exports = server;
