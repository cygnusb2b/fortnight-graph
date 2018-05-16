const ElasticClient = require('./client');

const { ELASTIC_HOST } = process.env;

const client = ElasticClient({ host: ELASTIC_HOST });

module.exports = client;
