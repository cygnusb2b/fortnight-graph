const mongoose = require('mongoose');

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
  image: {
    type: String,
    required: false,
    trim: true,
  },
});
