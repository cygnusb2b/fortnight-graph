const mongoose = require('../connections/mongoose/instance');
const schema = require('../schema/placement');

module.exports = mongoose.model('placement', schema);
