const mongoose = require('../../connections/mongoose/instance');
const schema = require('../../schema/analytics/click');

module.exports = mongoose.model('analytics-click', schema);
