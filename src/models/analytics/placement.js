const mongoose = require('../../connections/mongoose/instance');
const schema = require('../../schema/analytics/placement');

module.exports = mongoose.model('analytics-placement', schema);
