const mongoose = require('mongoose');
const ImageSchema = require('./image');

const { Schema } = mongoose;

module.exports = new Schema({
  name: {
    type: String,
    required: false,
    trim: true,
  },
  url: {
    type: String,
    required: false,
    trim: true,
  },
  title: {
    type: String,
    required: false,
    trim: true,
  },
  teaser: {
    type: String,
    required: false,
    trim: true,
  },
  image: ImageSchema,
});
