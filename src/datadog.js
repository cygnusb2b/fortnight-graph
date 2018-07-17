const { DD_ENABLED } = require('./env');
const tracer = require('dd-trace');

if (DD_ENABLED) tracer.init();
