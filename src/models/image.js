const mongoose = require('../connections/mongoose/instance');
const schema = require('../schema/image');

module.exports = mongoose.model('image', schema);
