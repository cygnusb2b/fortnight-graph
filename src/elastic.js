const { Client } = require('elasticsearch');

const { ELASTIC_HOST } = process.env;
console.info(ELASTIC_HOST);

const client = new Client({ host: ELASTIC_HOST });

const checkConnection = async () => {
  let isConnected = false;
  while (!isConnected) {
    process.stdout.write(`Waiting to connect to ElasticSearch: '${ELASTIC_HOST}'\n`);
    try {
      // eslint-disable-next-line no-await-in-loop
      const health = await client.cluster.health({});
      process.stdout.write(`Successfully connected to ElasticSearch: ${JSON.stringify(health)}\n`);
      isConnected = true;
    } catch (e) {
      process.stdout.write('Unable to connect to ElasticSearch. Retrying...');
    }
  }
};

module.exports = { client, checkConnection };
