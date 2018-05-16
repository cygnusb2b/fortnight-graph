const mongoose = require('../../connections/mongoose');
const schema = require('../../schema/analytics/request-object');

module.exports = mongoose.model('analytics-request-object', schema);
