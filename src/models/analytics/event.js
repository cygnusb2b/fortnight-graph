const mongoose = require('../../connections/mongoose');
const schema = require('../../schema/analytics/event');

module.exports = mongoose.model('analytics-event', schema);
