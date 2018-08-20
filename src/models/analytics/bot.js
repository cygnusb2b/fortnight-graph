const mongoose = require('../../connections/mongoose/instance');
const schema = require('../../schema/analytics/bot');

module.exports = mongoose.model('analytics-bot', schema);
