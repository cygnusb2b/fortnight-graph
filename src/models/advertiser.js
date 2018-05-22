const mongoose = require('../mongoose');
const schema = require('../schema/advertiser');

module.exports = mongoose.model('advertiser', schema);
