const mongoose = require('../connections/mongoose');
const schema = require('../schema/contact');

module.exports = mongoose.model('contact', schema);
