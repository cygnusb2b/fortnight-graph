const mongoose = require('./connections/mongoose');
const redis = require('./redis');
const app = require('./app');

module.exports = {
  app,
  mongoose,
  redis,
};
