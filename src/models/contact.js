const mongoose = require('../connections/mongoose/instance');
const schema = require('../schema/contact');

module.exports = mongoose.model('contact', schema);
