const mongoose = require('mongoose');
const bluebird = require('bluebird');
const output = require('../../output');

const {
  MONGO_DSN,
  MONGOOSE_DEBUG,
  NODE_ENV,
  ACCOUNT_KEY,
} = process.env;
mongoose.set('debug', Boolean(MONGOOSE_DEBUG));
mongoose.Promise = bluebird;

const connection = mongoose.createConnection(MONGO_DSN, {
  // autoIndex: process.env.NODE_ENV !== 'production',
  ignoreUndefined: true,
  promiseLibrary: bluebird,
});
connection.once('open', () => {
  output.write(`🛢️ 🛢️ 🛢️ Successful CORE MongoDB connection to '${MONGO_DSN}'`);
  if (NODE_ENV === 'development') {
    connection.model('account').findOneAndUpdate({ key: ACCOUNT_KEY }, { key: ACCOUNT_KEY }, {
      upsert: true,
      setDefaultsOnInsert: true,
    }, (err) => {
      if (err) throw err;
      output.write(`🔑 🔑 🔑 Successfully created account '${ACCOUNT_KEY}'`);
    });
  }
});
module.exports = connection;