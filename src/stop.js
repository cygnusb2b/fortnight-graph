const elastic = require('./elastic');
const mongoose = require('./connections/mongoose');
const redis = require('./redis');
const { write } = require('./output');

const stop = (promise, name) => {
  write(`> Disconnecting from ${name}...`);
  return promise.then((r) => {
    write(`> ${name} disconnected`);
    return r;
  });
};

module.exports = () => Promise.all([
  stop(mongoose.core.close(), 'MongoDB core'),
  stop(mongoose.instance.close(), 'MongoDB instance'),
  stop(new Promise((resolve, reject) => {
    redis.on('end', resolve);
    redis.on('error', reject);
    redis.quit();
  }), 'Redis'),
  stop(elastic.disconnect(), 'ElasticSearch'),
]);
