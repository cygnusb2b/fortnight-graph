const mongoose = require('mongoose');
const schema = require('../../schema/analytics/request');

module.exports = mongoose.model('analytics-request', schema);
