const elastic = require('./elastic');
const env = require('./env');
const initElastic = require('./elastic/init');
const mongoose = require('./connections/mongoose');
const redis = require('./redis');
const { write } = require('./output');

const { ELASTIC_HOST, ELASTIC_INDEX_RECREATE } = env;

const start = (promise, name, url) => {
  write(`> Connecting to ${name}...`);
  return promise.then((r) => {
    const u = typeof url === 'function' ? url(r) : url;
    write(`> ${name} connected ${u ? `(${u})` : ''}`);
    return r;
  });
};

module.exports = () => Promise.all([
  start(mongoose.core, 'MongoDB core', m => m.client.s.url),
  start(mongoose.instance, 'MongoDB tenant', m => m.client.s.url),
  start(elastic.connect().then(() => initElastic(elastic, ELASTIC_INDEX_RECREATE)), 'ElasticSearch', ELASTIC_HOST),
  start(new Promise((resolve, reject) => {
    redis.on('connect', resolve);
    redis.on('error', reject);
  }), 'Redis', () => redis.options.url),
]);
