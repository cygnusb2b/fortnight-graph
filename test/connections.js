const mongoose = require('../src/connections/mongoose');
const redis = require('../src/redis');
const models = require('../src/models');
const elastic = require('../src/elastic');
const initElastic = require('../src/elastic/init');

const { ACCOUNT_KEY } = process.env;

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
    mongoose.core.on('connected', resolve);
    mongoose.core.on('error', reject);
  }),
  new Promise((resolve, reject) => {
    mongoose.instance.on('connected', resolve);
    mongoose.instance.on('error', reject);
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
    mongoose.core.on('disconnected', resolve);
  }),
  new Promise((resolve, reject) => {
    mongoose.instance.on('disconnected', resolve);
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

let accountPromise;
const createAccount = () => {
  const run = () => mongoose.core.model('account').findOneAndUpdate({ key: ACCOUNT_KEY }, { key: ACCOUNT_KEY }, {
    upsert: true,
    setDefaultsOnInsert: true,
  });

  if (!accountPromise) {
    accountPromise = run();
  }
  return accountPromise;
};

before(async function() {
  this.timeout(30000);
  console.info('Global connections are being establised...');
  await connect();
  console.info('Connections established.');
  await createAccount();
  console.info('Test account created');
});

after(async function() {
  await indexes;
  await disconnect();
});
