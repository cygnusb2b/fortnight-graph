const initDb = require('./db');
const redis = require('./redis');
const app = require('./app');
const pkg = require('../package.json');

const { REDIS_DSN } = process.env;

module.exports = async () => {
  // Init the db.
  await initDb();

  // Use and init the redis session.
  redis.use('session', { url: REDIS_DSN, prefix: `${pkg.name}:session:` });
  await redis.get('session');

  // Now return the app, but do not initialize.
  return app;
};
