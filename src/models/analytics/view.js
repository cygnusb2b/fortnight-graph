const mongoose = require('mongoose');
const schema = require('../../schema/analytics/view');

module.exports = mongoose.model('analytics-view', schema);
