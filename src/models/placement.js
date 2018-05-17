const mongoose = require('../connections/mongoose');
const schema = require('../schema/placement');

module.exports = mongoose.model('placement', schema);
