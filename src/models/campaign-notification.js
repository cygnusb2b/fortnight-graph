const mongoose = require('../connections/mongoose/instance');
const schema = require('../schema/campaign-notification');

module.exports = mongoose.model('campaign-notification', schema);
