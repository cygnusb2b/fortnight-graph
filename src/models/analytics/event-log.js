const mongoose = require('mongoose');
const schema = require('../../schema/analytics/event-log');

module.exports = mongoose.model('analytics-event-log', schema);
