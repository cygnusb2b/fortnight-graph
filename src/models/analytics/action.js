const mongoose = require('../../connections/mongoose/instance');
const schema = require('../../schema/analytics/action');

module.exports = mongoose.model('analytics-action', schema);
