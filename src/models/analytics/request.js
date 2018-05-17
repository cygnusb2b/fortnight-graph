const mongoose = require('../../connections/mongoose');
const schema = require('../../schema/analytics/request');

module.exports = mongoose.model('analytics-request', schema);
