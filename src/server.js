const mongoose = require('./mongoose');
const redis = require('./redis');
const app = require('./app');
const elastic = require('./elastic');

const filter = require('./elastic/filters');
const analyzers = require('./elastic/analyzers');
const tokenizers = require('./elastic/tokenizers');
const charFilters = require('./elastic/char-filters');
const Advertiser = require('./models/advertiser');

//
//

const { ELASTIC_HOST, ELASTIC_INDEX } = process.env;

const initialize = async () => {
  await elastic.connect();
  await elastic.deleteIndex(ELASTIC_INDEX);
  await elastic.createIndex(ELASTIC_INDEX, {
    settings: {
      index: {
        analysis: {
          filter,
          analyzer: {
            default: analyzers.entity_name,
            entity_tri_gram: analyzers.entity_tri_gram,
            entity_exact: analyzers.entity_exact,
            entity_starts_with: analyzers.entity_starts_with,
            entity_starts_with_search: analyzers.entity_starts_with_search,
            default_search: analyzers.entity_name,
          },
          tokenizer: tokenizers,
          char_filter: charFilters,
        },
      },
    },
  });
};

const mapAndSync = async (Model) => {
  await Model.esCreateMapping().then(() => console.info(`Mapping for ${Model.modelName} complete.`));
  await Model.esSynchronize().then(() => console.info(`Syncing for ${Model.modelName} complete.`));

};

initialize().then(() => process.stdout.write(`🔍 🔍 🔍 Successful ElasticSearch connection to '${ELASTIC_HOST}'\n`)).then(() => {
  mapAndSync(Advertiser);
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
  elastic,
};
