const mongoose = require('mongoose');
const bluebird = require('bluebird');
const env = require('../../env');
const { name, version } = require('../../../package.json');

const { MONGO_DSN, MONGOOSE_DEBUG, ACCOUNT_KEY } = env;
mongoose.set('debug', Boolean(MONGOOSE_DEBUG));
mongoose.Promise = bluebird;

const instanceDSN = MONGO_DSN.replace('/fortnight', `/fortnight-${ACCOUNT_KEY}`);

const connection = mongoose.createConnection(instanceDSN, {
  // autoIndex: env.NODE_ENV !== 'production',
  appname: `${name} v${version}`,
  bufferMaxEntries: 0, // Default -1
  ignoreUndefined: true,
  promiseLibrary: bluebird,
});
module.exports = connection;
