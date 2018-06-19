const mongoose = require('../../connections/mongoose/instance');
const schema = require('../../schema/analytics/load');

module.exports = mongoose.model('analytics-load', schema);
