const mongoose = require('../connections/mongoose/instance');
const schema = require('../schema/email-deployment');

module.exports = mongoose.model('email-deployment', schema);
