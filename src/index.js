const http = require('http');
const { createTerminus } = require('@godaddy/terminus');
require('./newrelic');
const app = require('./app');
const env = require('./env');
const health = require('./health');
const pkg = require('../package.json');
const start = require('./start');
const stop = require('./stop');
const { write } = require('./output');

const { PORT } = env;

const server = http.createServer(app);

const boot = async () => {
  // Start any services that need to connect before the web server listens...
  await start();

  // Create the terminus instance for health checks and graceful shutdown...
  createTerminus(server, {
    timout: 1000,
    signals: ['SIGTERM', 'SIGINT', 'SIGHUP', 'SIGQUIT'],
    healthChecks: { '/_health': health() },
    onSignal: () => {
      write('> Cleaning up...');
      return stop().catch(e => write('> CLEANUP ERRORS:', e));
    },
    onShutdown: () => write('> Cleanup finished. Shutting down.'),
  });

  // Run the web server.
  server.listen(PORT, () => write(`> Ready on http://0.0.0.0:${PORT}`));
};

// Simulate future NodeJS behavior by throwing unhandled Promise rejections.
process.on('unhandledRejection', (e) => {
  write('> Unhandled promise rejection. Throwing error...');
  throw e;
});

write(`> Booting ${pkg.name} v${pkg.version}...`);
boot().catch(e => setImmediate(() => { throw e; }));

module.exports = server;
