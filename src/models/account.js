const mongoose = require('mongoose');
const schema = require('../schema/account');

module.exports = mongoose.model('account', schema);
