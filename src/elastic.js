const ElasticClient = require('./elastic/client');

const { ELASTIC_HOST } = process.env;

const client = ElasticClient({ host: ELASTIC_HOST });

module.exports = client;
