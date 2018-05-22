const elasticPlugin = require('mongoose-elasticsearch-xp');
const filter = require('./filters');
const analyzers = require('./analyzers');
const tokenizers = require('./tokenizers');
const charFilters = require('./char-filters');
const { client } = require('../elastic');

const { ELASTIC_INDEX_PREFIX } = process.env;

const applyElasticPlugin = (schema, indexSuffix) => {
  if (!indexSuffix) throw new Error('An index suffix name must be provided.');
  schema.plugin(elasticPlugin, {
    client,
    index: `${ELASTIC_INDEX_PREFIX}-${indexSuffix}`,
    mappingSettings: {
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
    },
  });
  const { options } = schema;
  options.es_enabled = true;
};

const setEntityFields = (schema, name) => {
  const path = schema.path(name);
  const options = {
    es_indexed: true,
    es_type: 'text',
    es_analyzer: 'default',
    es_fields: {
      exact: {
        type: 'text',
        analyzer: 'entity_exact',
      },
      edge: {
        type: 'text',
        analyzer: 'entity_starts_with',
        search_analyzer: 'entity_starts_with_search',
      },
      ngram: {
        type: 'text',
        analyzer: 'entity_tri_gram',
      },
      phonetic: {
        type: 'text',
        analyzer: 'entity_sounds_like',
      },
    },
  };
  path.options = {
    ...path.options,
    ...options,
  };
};

module.exports = { applyElasticPlugin, setEntityFields };
