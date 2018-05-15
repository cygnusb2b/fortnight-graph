const { Client } = require('elasticsearch');

const ElasticClient = ({ host }) => {
  let connected = false;
  const client = new Client({ host });

  return {
    async connect() {
      if (connected) return client;
      try {
        await client.cluster.health({});
        connected = true;
        return client;
      } catch (e) {
        setTimeout(() => this.connect(), 3000);
      }
    },
  };
};

module.exports = ElasticClient;
