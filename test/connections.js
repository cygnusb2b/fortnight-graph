const mongoose = require('../src/mongoose');
const redis = require('../src/redis');
const models = require('../src/models');
const elastic = require('../src/elastic');
const initElastic = require('../src/elastic/init');

const index = Model => new Promise((resolve, reject) => {
  Model.on('index', (err) => {
    if (err) {
      reject(err)
    } else {
      resolve();
    }
  });
});

const indexes = Promise.all(Object.keys(models).map(name => index(models[name])));

const connect = () => Promise.all([
  new Promise((resolve, reject) => {
    mongoose.connection.on('connected', resolve);
    mongoose.connection.on('error', reject);
  }),
  new Promise((resolve, reject) => {
    redis.on('connect', () => {
      resolve();
    });
    redis.on('error', (err) => {
      reject(err);
    });
  }),
  initElastic(elastic, true),
]);



const disconnect = () => Promise.all([
  new Promise((resolve, reject) => {
    mongoose.connection.on('disconnected', resolve);
    mongoose.disconnect((err) => {
      if (err) reject(err);
    });
  }),
  new Promise((resolve, reject) => {
    redis.on('end', () => {
      resolve();
    });
    redis.on('error', (err) => {
      reject(err);
    });
    redis.quit();
  }),
  elastic.disconnect(),
]);

before(async function() {
  this.timeout(30000);
  console.info('Global connections are being establised...');
  await connect();
  console.info('Connections established.');
});

after(async function() {
  await indexes;
  await disconnect();
});
