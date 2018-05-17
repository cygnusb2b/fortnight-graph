const mongoose = require('../../connections/mongoose');
const schema = require('../../schema/analytics/click');

module.exports = mongoose.model('analytics-click', schema);
