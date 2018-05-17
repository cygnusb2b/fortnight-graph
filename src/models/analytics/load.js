const mongoose = require('../../connections/mongoose');
const schema = require('../../schema/analytics/load');

module.exports = mongoose.model('analytics-load', schema);
