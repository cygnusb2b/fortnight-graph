require('dotenv').config();

const bluebird = require('bluebird');
const mongoose = require('mongoose');
const redis = require('./redis');
const pkg = require('../package.json');
const app = require('./app');

const {
  PORT,
  MONGO_DSN,
  REDIS_DSN,
  MONGOOSE_DEBUG,
} = process.env;

// Initialize DB
mongoose.set('debug', Boolean(MONGOOSE_DEBUG));
mongoose.Promise = bluebird;
mongoose.connect(MONGO_DSN, {
  // autoIndex: process.env.NODE_ENV !== 'production',
  ignoreUndefined: true,
  promiseLibrary: bluebird,
}).then(() => process.stdout.write(`Mongoose connected to '${MONGO_DSN}'\n`));

redis.use('session', { url: REDIS_DSN, prefix: `${pkg.name}:session:` });

app.listen(PORT);
process.stdout.write(`Express app '${pkg.name}' listening on port ${PORT}\n`);
