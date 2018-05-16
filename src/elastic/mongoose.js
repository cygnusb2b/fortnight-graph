const elasticPlugin = require('mongoose-elasticsearch-xp');
const { client } = require('../elastic');

module.exports = (schema) => {
  schema.plugin(elasticPlugin, {
    client,
    index: 'fortnight',
  });
};
