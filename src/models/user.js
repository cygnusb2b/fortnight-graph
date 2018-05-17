const mongoose = require('../mongoose');
const schema = require('../schema/user');

module.exports = mongoose.model('user', schema);
