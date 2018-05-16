const { Client } = require('elasticsearch');

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

const ElasticClient = (options) => {
  const client = new Client(options);
  let connected = false;

  return {
    get client() {
      return client;
    },

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

    async createIndex(index, body) {
      await this.connect();
      const exists = await this.client.indices.exists({ index });
      if (!exists) await this.client.indices.create({ index, body });
    },

    async deleteIndex(index) {
      await this.connect();
      const exists = await this.client.indices.exists({ index });
      if (exists) await this.client.indices.delete({ index });
    },

    async putSettings(index, body) {
      await this.connect();
      return this.client.indices.putSettings({ index, body });
    },
  };
};

module.exports = ElasticClient;
