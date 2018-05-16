const mongoose = require('../../connections/mongoose');
const schema = require('../../schema/analytics/view');

module.exports = mongoose.model('analytics-view', schema);
