const mongoose = require('../connections/mongoose/instance');
const schema = require('../schema/topic');

module.exports = mongoose.model('topic', schema);
