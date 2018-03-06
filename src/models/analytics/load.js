const mongoose = require('mongoose');
const schema = require('../../schema/analytics/load');

module.exports = mongoose.model('analytics-load', schema);
