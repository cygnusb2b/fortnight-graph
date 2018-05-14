const { Client } = require('elasticsearch');
const { throttle } = require('lodash/function');

const { ELASTIC_HOST } = process.env;

const client = new Client({ host: ELASTIC_HOST });

const checkConnection = throttle(async () => {
  process.stdout.write(`Waiting to connect to ElasticSearch: '${ELASTIC_HOST}'\n`);
  try {
    // eslint-disable-next-line no-await-in-loop
    const health = await client.cluster.health({});
    process.stdout.write(`Successfully connected to ElasticSearch: ${JSON.stringify(health)}\n`);
  } catch (e) {
    process.stdout.write('Unable to connect to ElasticSearch. Retrying...\n');
    checkConnection();
  }
}, 3000);

module.exports = { client, checkConnection };
