const { Schema } = require('mongoose');

module.exports = new Schema({
  x: {
    type: Number,
    required: true,
    min: 0,
    max: 1,
  },
  y: {
    type: Number,
    required: true,
    min: 0,
    max: 1,
  },
});
