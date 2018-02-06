const mongoose = require('mongoose');
const bluebird = require('bluebird');
const redis = require('./redis');
const app = require('./app');

const { MONGO_DSN, MONGOOSE_DEBUG } = process.env;
mongoose.set('debug', Boolean(MONGOOSE_DEBUG));
mongoose.Promise = bluebird;

mongoose.connect(MONGO_DSN, {
  // autoIndex: process.env.NODE_ENV !== 'production',
  ignoreUndefined: true,
  promiseLibrary: bluebird,
}).then(() => {
  process.stdout.write(`Successful MongoDB connection to '${MONGO_DSN}'\n`);
});

/**
 * Export these so that can be exited.
 * @todo Implement a graceful shutdown for these!
 * @see https://github.com/kriasoft/nodejs-api-starter/blob/master/src/server.js
 */
module.exports = {
  app,
  mongoose,
  redis,
};
