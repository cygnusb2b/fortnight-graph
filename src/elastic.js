const ElasticClient = require('./elastic/client');

const { ELASTIC_HOST } = process.env;

const client = ElasticClient({ host: ELASTIC_HOST });

client.connect().then(() => process.stdout.write(`🔍 🔍 🔍 Successful ElasticSearch connection to '${ELASTIC_HOST}'\n`));

module.exports = client;
