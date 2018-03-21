const mongoose = require('mongoose');
const validator = require('validator');

const { Schema } = mongoose;

const schema = new Schema({
  email: {
    type: String,
    required: true,
    trim: true,
    unique: true,
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
  name: {
    type: String,
    required: false,
    trim: true,
  },
  givenName: {
    type: String,
    required: false,
    trim: true,
  },
  familyName: {
    type: String,
    required: false,
    trim: true,
  },
}, {
  timestamps: true,
});

schema.pre('save', function setName(next) {
  this.name = `${this.givenName} ${this.familyName}`;
  next();
});

module.exports = schema;