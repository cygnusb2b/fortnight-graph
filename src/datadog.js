const tracer = require('dd-trace');
const { DD_ENABLED, DD_SERVICE_NAME } = require('./env');
const { NODE_ENV } = process.env;

if (DD_ENABLED) {
  tracer.init({
    env: NODE_ENV,
    service: DD_SERVICE_NAME,
    plugins: false,
  });

  tracer.use('express');
  tracer.use('mongodb-core');
  tracer.use('graphql');
}

module.exports = tracer;
