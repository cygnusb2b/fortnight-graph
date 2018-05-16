const mongoose = require('../../connections/mongoose');
const schema = require('../../schema/analytics/bot');

module.exports = mongoose.model('analytics-bot', schema);
