const mongoose = require('../mongoose');
const schema = require('../schema/image');

module.exports = mongoose.model('image', schema);
