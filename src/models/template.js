const mongoose = require('../connections/mongoose');
const schema = require('../schema/template');

module.exports = mongoose.model('template', schema);
