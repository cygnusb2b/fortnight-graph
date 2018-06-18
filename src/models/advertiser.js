const mongoose = require('../connections/mongoose/instance');
const schema = require('../schema/advertiser');

module.exports = mongoose.model('advertiser', schema);
