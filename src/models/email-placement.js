const mongoose = require('../connections/mongoose/instance');
const schema = require('../schema/email-placement');

module.exports = mongoose.model('email-placement', schema);
