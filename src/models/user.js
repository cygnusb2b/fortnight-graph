const mongoose = require('../connections/mongoose');
const schema = require('../schema/user');

module.exports = mongoose.model('user', schema);
