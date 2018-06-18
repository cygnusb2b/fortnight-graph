const mongoose = require('../../connections/mongoose/instance');
const schema = require('../../schema/analytics/request-object');

module.exports = mongoose.model('analytics-request-object', schema);
