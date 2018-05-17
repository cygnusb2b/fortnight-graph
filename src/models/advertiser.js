const mongoose = require('../connections/mongoose');
const schema = require('../schema/advertiser');

module.exports = mongoose.model('advertiser', schema);
