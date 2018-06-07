const mongoose = require('../mongoose');
const schema = require('../schema/story');

module.exports = mongoose.model('story', schema);
