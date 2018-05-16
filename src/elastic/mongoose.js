const elasticPlugin = require('mongoose-elasticsearch-xp');
const { client } = require('../elastic');

const applyElasticPlugin = (schema) => {
  schema.plugin(elasticPlugin, {
    client,
    index: 'fortnight',
  });
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
