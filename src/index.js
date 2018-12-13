const http = require('http');
const { createTerminus } = require('@godaddy/terminus');
require('./newrelic');
const env = require('./env');
const output = require('./output');
const pkg = require('../package.json');
const { app, mongoose, redis } = require('./server');

const { PORT } = env;

const server = http.createServer(app);

const boot = async () => {
  // Start any services that need to connect before the web server listens...
  // These need retries...
  await Promise.all([
    mongoose.core,
    mongoose.instance,
    new Promise((resolve, reject) => {
      redis.on('connect', resolve);
      redis.on('error', reject);
    }),
  ]);

  /**
   * @todo Update gulp to run lint/serve in parallel; handle elaticsearch
   */
  createTerminus(server, {
    timout: 1000,
    signals: ['SIGTERM', 'SIGINT', 'SIGHUP', 'SIGQUIT'],
    onSignal: () => {
      output.write('> Cleaning up...');
      return Promise.all([
        mongoose.core.close().then(() => output.write('> CORE MongoDB disconnected gracefully.')),
        mongoose.instance.close().then(() => output.write('> INSTANCE MongoDB disconnected gracefully.')),
        new Promise((resolve, reject) => {
          redis.on('end', resolve);
          redis.on('error', reject);
          redis.quit();
        }).then(() => output.write('> Redis disconnected gracefully.')),
      ]).catch(e => output.write('> CLEANUP ERRORS:', e));
    },
    onShutdown: () => output.write('> Cleanup finished. Shutting down.'),
  });

  // Run the web server.
  server.listen(PORT, () => {
    output.write(`> Ready on http://0.0.0.0:${PORT}`);
  });
};

// Simulate future NodeJS behavior by throwing unhandled Promise rejections.
process.on('unhandledRejection', (e) => {
  output.write('> Unhandled promise rejection. Throwing error...');
  throw e;
});

output.write(`> Booting ${pkg.name} v${pkg.version}...`);
boot().catch(e => setImmediate(() => { throw e; }));
