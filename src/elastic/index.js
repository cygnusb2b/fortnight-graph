const ElasticClient = require('./client');

const { ELASTIC_HOST, NODE_ENV } = process.env;

const client = ElasticClient({
  host: ELASTIC_HOST,
  log: {
    type: 'stdio',
    levels: NODE_ENV === 'test' ? [] : ['error', 'warning'],
  },
});

module.exports = client;
