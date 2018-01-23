const mongoose = require('mongoose');
const schema = require('../schema/request');

module.exports = mongoose.model('request', schema);
