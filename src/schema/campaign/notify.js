const mongoose = require('mongoose');
const validator = require('validator');

const { Schema } = mongoose;

module.exports = new Schema({
  name: {
    type: String,
    trim: true,
    required: false,
  },
  value: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    validate: [
      {
        validator(email) {
          return validator.isEmail(email);
        },
        message: 'Invalid email address {VALUE}',
      },
    ],
  },
});
