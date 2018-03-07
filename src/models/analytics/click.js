const mongoose = require('mongoose');
const schema = require('../../schema/analytics/click');

module.exports = mongoose.model('analytics-click', schema);
