const { Schema } = require('mongoose');
const imageSchema = require('../image');

module.exports = new Schema({
  title: {
    type: String,
    trim: true,
  },
  teaser: {
    type: String,
    trim: true,
  },
  status: {
    type: String,
    default: 'Active',
    enum: ['Draft', 'Active'],
  },
  image: imageSchema,
});
