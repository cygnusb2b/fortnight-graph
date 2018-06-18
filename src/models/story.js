const mongoose = require('../connections/mongoose/instance');
const schema = require('../schema/story');

module.exports = mongoose.model('story', schema);
