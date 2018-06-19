const mongoose = require('../../connections/mongoose/instance');
const schema = require('../../schema/analytics/event');

module.exports = mongoose.model('analytics-event', schema);
