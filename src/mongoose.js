const mongoose = require('mongoose');
const bluebird = require('bluebird');
const output = require('./output');

const { MONGO_DSN, MONGOOSE_DEBUG } = process.env;
mongoose.set('debug', Boolean(MONGOOSE_DEBUG));
mongoose.Promise = bluebird;

mongoose.connect(MONGO_DSN, {
  // autoIndex: process.env.NODE_ENV !== 'production',
  ignoreUndefined: true,
  promiseLibrary: bluebird,
}).then(() => {
  output.write(`🛢️ 🛢️ 🛢️ Successful MongoDB connection to '${MONGO_DSN}'`);
  return mongoose;
});

module.exports = mongoose;
