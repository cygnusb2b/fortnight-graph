const mongoose = require('mongoose');

const { Schema } = mongoose;

module.exports = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
}, { timestamps: true });
