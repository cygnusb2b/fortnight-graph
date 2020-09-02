const tracer = require('dd-trace');
const { DD_TRACE_ENABLED } = require('./env');

process.env.DD_TRACE_ENABLED = DD_TRACE_ENABLED;

tracer.init({ analytics: true });

module.exports = tracer;
