const mongoose = require('../connections/mongoose/instance');
const schema = require('../schema/campaign');

module.exports = mongoose.model('campaign', schema);
