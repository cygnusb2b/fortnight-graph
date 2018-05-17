const { Schema } = require('mongoose');
const ImageSchema = require('./image');


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
  image: ImageSchema,
});
