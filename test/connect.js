const mongoose = require('../src/mongoose');
const redis = require('../src/redis');

const connect = () => Promise.all([
  new Promise((resolve, reject) => mongoose.connection.on('connected', resolve)),
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
    mongoose.connection.on('disconnected', resolve);
    mongoose.disconnect();
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

// const disconnect = Promise.all([
//   new Promise((resolve, reject) => {
//     const mongoose = require('../src/mongoose');
//     mongoose.connection.on('disconnected', resolve);
//     mongoose.disconnect();
//   }),
//   new Promise((resolve, reject) => {

//     redis.on('end', () => {
//       resolve();
//     });
//     redis.on('error', (err) => {
//       reject(err);
//     });
//     redis.quit();
//   }),
// ]);

before(async function() {
  await connect();
});

after(async function() {
  await disconnect();
});
