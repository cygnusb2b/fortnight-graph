const mongoose = require('mongoose');

const { Schema } = mongoose;

module.exports = new Schema({
  start: {
    type: Date,
    required: true,
  },
  end: {
    type: Date,
  },
  placements: [String],
  kvs: [{
    key: {
      type: String,
      required: true,
    },
    value: {
      type: String,
      required: true,
    },
  }],
});
