const Promise = require('bluebird');
const filter = require('./filters');
const analyzers = require('./analyzers');
const tokenizers = require('./tokenizers');
const charFilters = require('./char-filters');
const models = require('../models');

const { ELASTIC_INDEX } = process.env;

const outputMapping = name => process.stdout.write(`ElasticSearch mappings for '${name}' successfully set.\n`);
const outputSynchro = name => process.stdout.write(`ElasticSearch populate for '${name}' complete.\n`);

const searchModels = ['Advertiser'];

const initialize = async (elastic, recreate = true) => {
  const messages = [];
  if (recreate === true) {
    await elastic.deleteIndex(ELASTIC_INDEX);
  }
  const exists = await elastic.indexExists(ELASTIC_INDEX);
  await elastic.createIndex(ELASTIC_INDEX, {
    settings: {
      index: {
        analysis: {
          filter,
          analyzer: {
            default: analyzers.entity_name,
            default_search: analyzers.entity_name,
            ...analyzers,
          },
          tokenizer: tokenizers,
          char_filter: charFilters,
        },
      },
    },
  });

  if (!exists) {
    const promises = [];
    // The index previously did not exist. Map and populate all models.
    searchModels.forEach((name) => {
      const Model = models[name];
      promises.push(Model.esCreateMapping().then(() => outputMapping(name)));
      promises.push(Model.esSynchronize().then(() => outputSynchro(name)));
    });
    await Promise.all(promises);
  }
};

module.exports = initialize;
