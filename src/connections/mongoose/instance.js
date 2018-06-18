const mongoose = require('mongoose');
const bluebird = require('bluebird');
const output = require('../../output');

const { MONGO_INSTANCE_DSN, MONGOOSE_DEBUG } = process.env;
mongoose.set('debug', Boolean(MONGOOSE_DEBUG));
mongoose.Promise = bluebird;

const connection = mongoose.createConnection(MONGO_INSTANCE_DSN, {
  // autoIndex: process.env.NODE_ENV !== 'production',
  ignoreUndefined: true,
  promiseLibrary: bluebird,
});
connection.once('open', () => output.write(`🛢️ 🛢️ 🛢️ Successful INSTANCE MongoDB connection to '${MONGO_DSN}'`));
module.exports = connection;
