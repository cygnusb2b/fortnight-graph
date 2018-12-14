const { HealthCheckError } = require('@godaddy/terminus');
const elastic = require('./elastic');
const mongoose = require('./connections/mongoose');
const pkg = require('../package.json');
const redis = require('./redis');

const { log } = console;

const ping = (promise, name) => promise.then(() => `${name} pinged successfully.`);

const mongodb = () => {
  const args = [{ _id: pkg.name }, { $set: { last: new Date() } }, { upsert: true }];
  return Promise.all([
    mongoose.core.db.command({ ping: 1 }),
    mongoose.core.db.collection('pings').updateOne(...args),
    mongoose.instance.db.command({ ping: 1 }),
    mongoose.instance.db.collection('pings').updateOne(...args),
  ]);
};

module.exports = () => () => {
  const errors = [];
  return Promise.all([
    ping(mongodb(), 'MongoDB'),
    ping(redis.pingAsync(), 'Redis'),
    ping(elastic.client.cluster.health({}), 'ElasticSearch'),
  ].map(p => p.catch((err) => {
    errors.push(err);
  }))).then((res) => {
    if (errors.length) {
      log(errors);
      throw new HealthCheckError('Unhealthy', errors.map(e => e.message));
    }
    return res;
  });
};
