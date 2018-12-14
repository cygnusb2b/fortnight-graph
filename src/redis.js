const Promise = require('bluebird');
const redis = require('redis');
const env = require('./env');

Promise.promisifyAll(redis.RedisClient.prototype);
Promise.promisifyAll(redis.Multi.prototype);

const options = { url: env.REDIS_DSN };
const client = redis.createClient(options);

module.exports = client;
