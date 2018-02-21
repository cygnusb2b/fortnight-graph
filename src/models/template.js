const mongoose = require('mongoose');
const schema = require('../schema/template');

module.exports = mongoose.model('template', schema);
