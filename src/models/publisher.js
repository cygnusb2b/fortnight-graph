const mongoose = require('../connections/mongoose');
const schema = require('../schema/publisher');

module.exports = mongoose.model('publisher', schema);
