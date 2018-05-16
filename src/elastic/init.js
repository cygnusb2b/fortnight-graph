const Promise = require('bluebird');
const filter = require('./filters');
const analyzers = require('./analyzers');
const tokenizers = require('./tokenizers');
const charFilters = require('./char-filters');
const models = require('./models');

const { ELASTIC_INDEX } = process.env;

const mapMsg = Model => `ElasticSearch mappings for '${Model.modelName}' successfully set.`;
const syncMsg = Model => `ElasticSearch populate for '${Model.modelName}' complete.`;

const initialize = async (elastic, recreate = false) => {
  const messages = [];
  if (recreate) {
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
    models.forEach((Model) => {
      promises.push(Model.esCreateMapping().then(() => messages.push(mapMsg(Model))));
      promises.push(Model.esSynchronize().then(() => messages.push(syncMsg(Model))));
    });
    await Promise.all(promises).then(() => process.stdout.write(`${messages.join('\n')}\n`));
  }
};

module.exports = initialize;
