const mongoose = require('../connections/mongoose/core');
const schema = require('../schema/account');

module.exports = mongoose.model('account', schema);
