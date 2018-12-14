const http = require('http');
const { createTerminus } = require('@godaddy/terminus');
require('./newrelic');
const app = require('./app');
const elastic = require('./elastic');
const env = require('./env');
const initElastic = require('./elastic/init');
const mongoose = require('./connections/mongoose');
const pkg = require('../package.json');
const redis = require('./redis');
const start = require('./start');
const stop = require('./stop');
const { write } = require('./output');

const { PORT, ELASTIC_HOST, ELASTIC_INDEX_RECREATE } = env;

const server = http.createServer(app);

const boot = async () => {
  // Start any services that need to connect before the web server listens...
  await Promise.all([
    start(mongoose.core, 'MongoDB core', m => m.client.s.url),
    start(mongoose.instance, 'MongoDB tenant', m => m.client.s.url),
    start(elastic.connect().then(() => initElastic(elastic, ELASTIC_INDEX_RECREATE)), 'ElasticSearch', ELASTIC_HOST),
    start(new Promise((resolve, reject) => {
      redis.on('connect', resolve);
      redis.on('error', reject);
    }), 'Redis', () => redis.options.url),
  ]);

  // Create the terminus instance for graceful shutdown...
  createTerminus(server, {
    timout: 1000,
    signals: ['SIGTERM', 'SIGINT', 'SIGHUP', 'SIGQUIT'],
    onSignal: () => {
      write('> Cleaning up...');
      return Promise.all([
        stop(mongoose.core.close(), 'MongoDB core'),
        stop(mongoose.instance.close(), 'MongoDB instance'),
        stop(new Promise((resolve, reject) => {
          redis.on('end', resolve);
          redis.on('error', reject);
          redis.quit();
        }), 'Redis'),
        stop(elastic.disconnect(), 'ElasticSearch'),
      ]).catch(e => write('> CLEANUP ERRORS:', e));
    },
    onShutdown: () => write('> Cleanup finished. Shutting down.'),
  });

  // Run the web server.
  server.listen(PORT, () => {
    write(`> Ready on http://0.0.0.0:${PORT}`);
  });
};

// Simulate future NodeJS behavior by throwing unhandled Promise rejections.
process.on('unhandledRejection', (e) => {
  write('> Unhandled promise rejection. Throwing error...');
  throw e;
});

write(`> Booting ${pkg.name} v${pkg.version}...`);
boot().catch(e => setImmediate(() => { throw e; }));

module.exports = server;
