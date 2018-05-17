const mongoose = require('../mongoose');
const schema = require('../schema/contact');

module.exports = mongoose.model('contact', schema);
