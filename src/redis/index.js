const client = require('./client');

const clients = {};

module.exports = {
  use(name, options) {
    if (!name) {
      throw new Error('The Redis client name must be specified!');
    }
    if (clients[name]) {
      throw new Error(`Redis client ${name} already exists!`);
    }
    clients[name] = client(options);
    return this;
  },
  get(name) {
    if (!clients[name]) {
      throw new Error(`Redis client ${name} does not exist!`);
    }
    return clients[name];
  },
};
