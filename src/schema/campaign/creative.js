const mongoose = require('mongoose');
const ImageSchema = require('./image');

const { Schema } = mongoose;

module.exports = new Schema({
  title: {
    type: String,
    trim: true,
  },
  teaser: {
    type: String,
    trim: true,
  },
  image: ImageSchema,
});
