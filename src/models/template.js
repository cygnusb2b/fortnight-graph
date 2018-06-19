const mongoose = require('../connections/mongoose/instance');
const schema = require('../schema/template');

module.exports = mongoose.model('template', schema);
