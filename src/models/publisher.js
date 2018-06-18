const mongoose = require('../connections/mongoose/instance');
const schema = require('../schema/publisher');

module.exports = mongoose.model('publisher', schema);
