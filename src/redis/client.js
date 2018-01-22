const bluebird = require('bluebird');
const redis = require('redis');

bluebird.promisifyAll(redis.RedisClient.prototype);

module.exports = (options) => {
  const client = redis.createClient(options);
  client.on('connect', () => {
    process.stdout.write(`Successful Redis connection with options '${JSON.stringify(options)}'\n`);
  });
  return client;
};
