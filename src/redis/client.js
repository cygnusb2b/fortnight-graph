const Promise = require('bluebird');
const redis = require('redis');

Promise.promisifyAll(redis.RedisClient.prototype);

const create = options => new Promise((resolve, reject) => {
  const client = redis.createClient(options);
  client.on('connect', () => {
    resolve(client);
    process.stdout.write(`Successful Redis connection with options '${JSON.stringify(options)}'\n`);
  });
  client.on('error', (err) => {
    client.end(true);
    reject(err);
  });
});

module.exports = {
  create,
};
