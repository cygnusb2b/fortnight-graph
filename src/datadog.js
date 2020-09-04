const tracer = require('dd-trace');
const { DD_TRACE_ENABLED, DD_SERVICE } = require('./env');

process.env.DD_TRACE_ENABLED = DD_TRACE_ENABLED;
process.env.DD_SERVICE = DD_SERVICE;

tracer.init({ analytics: true });

module.exports = tracer;
