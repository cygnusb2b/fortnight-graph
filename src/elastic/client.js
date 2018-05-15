const { Client } = require('elasticsearch');

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

const ElasticClient = (options) => {
  const client = new Client(options);
  let connected = false;

  return {
    async connect() {
      if (!connected) {
        try {
          await client.cluster.health({});
          connected = true;
        } catch (e) {
          await delay(3000);
          await this.connect();
        }
      }
    },
  };
};

module.exports = ElasticClient;
