const tracer = require('dd-trace');
const {
  DD_ENABLED,
  DD_TRACE_DEBUG,
  DD_SERVICE_NAME,
  DD_TRACE_AGENT_HOSTNAME,
  DD_TRACE_AGENT_PORT,
  DD_ENV,
} = require('./env');

if (DD_ENABLED) {
  tracer.init({
    debug: DD_TRACE_DEBUG,
    service: DD_SERVICE_NAME,
    hostname: DD_TRACE_AGENT_HOSTNAME,
    port: DD_TRACE_AGENT_PORT,
    env: DD_ENV,
  });
}

module.exports = tracer;
