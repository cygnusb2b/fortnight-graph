const mongoose = require('../../connections/mongoose/instance');
const schema = require('../../schema/analytics/request');

module.exports = mongoose.model('analytics-request', schema);
