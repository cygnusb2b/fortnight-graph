const mongoose = require('mongoose');
const schema = require('../schema/publisher');

module.exports = mongoose.model('publisher', schema);
