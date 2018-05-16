const filter = require('./filters');
const analyzers = require('./analyzers');
const tokenizers = require('./tokenizers');
const charFilters = require('./char-filters');
const models = require('../models');

const { ELASTIC_INDEX } = process.env;

const outputMapping = name => process.stdout.write(`ElasticSearch mappings for '${name}' successfully set.\n`);

const initialize = async (elastic) => {
  await elastic.connect();
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
  const mappings = Promise.all(['Advertiser'].map(name => models[name].esCreateMapping().then(() => outputMapping(name))));
  await mappings;
};

module.exports = initialize;
