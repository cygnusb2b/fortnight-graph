const mongoose = require('../../connections/mongoose/instance');
const schema = require('../../schema/analytics/campaign');

module.exports = mongoose.model('analytics-campaign', schema);
