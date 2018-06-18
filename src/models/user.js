const mongoose = require('../connections/mongoose/instance');
const schema = require('../schema/user');

module.exports = mongoose.model('user', schema);
