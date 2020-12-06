const mongoose = require('../connections/mongoose/instance');
const schema = require('../schema/email-line-item');

module.exports = mongoose.model('email-line-item', schema);
