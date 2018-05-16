const mongoose = require('./mongoose');
const redis = require('./redis');
const app = require('./app');
const elastic = require('./elastic');
const initElastic = require('./elastic/init');

initElastic(elastic).then(() => process.stdout.write(`🔍 🔍 🔍 ElasticSearch connection to '${process.env.ELASTIC_HOST}' is ready.\n`));

/**
 * Export these so that can be exited.
 * @todo Implement a graceful shutdown for these!
 * @see https://github.com/kriasoft/nodejs-api-starter/blob/master/src/server.js
 */
module.exports = {
  app,
  mongoose,
  redis,
  elastic,
};
