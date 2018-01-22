const mongoose = require('mongoose');
const schema = require('../schema/campaign');

module.exports = mongoose.model('campaign', schema);
