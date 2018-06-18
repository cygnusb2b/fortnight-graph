const mongoose = require('./connections/mongoose');
const redis = require('./redis');
const app = require('./app');
const output = require('./output');
const elastic = require('./elastic');
const initElastic = require('./elastic/init');

const { ELASTIC_INDEX_RECREATE, ELASTIC_HOST } = process.env;

initElastic(elastic, ELASTIC_INDEX_RECREATE)
  .then(() => output.write(`🔍 🔍 🔍 ElasticSearch connection to '${ELASTIC_HOST}' is ready.`));

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
