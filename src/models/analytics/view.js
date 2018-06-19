const mongoose = require('../../connections/mongoose/instance');
const schema = require('../../schema/analytics/view');

module.exports = mongoose.model('analytics-view', schema);
