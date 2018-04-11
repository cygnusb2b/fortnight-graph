const mongoose = require('mongoose');
const connection = require('../src/connections/mongoose');
const redis = require('../src/connections/redis');
const models = require('../src/models');

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
    connection.on('connected', resolve);
    connection.on('error', reject);
  }),
  new Promise((resolve, reject) => {
    redis.on('connect', () => {
      resolve();
    });
    redis.on('error', (err) => {
      reject(err);
    });
  }),
]);



const disconnect = () => Promise.all([
  new Promise((resolve, reject) => {
    connection.on('disconnected', resolve);
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
]);

before(async function() {
  await connect();
});

after(async function() {
  await indexes;
  await disconnect();
});
