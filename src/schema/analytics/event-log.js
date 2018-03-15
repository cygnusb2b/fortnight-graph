const { Schema } = require('mongoose');

module.exports = new Schema({
  hash: {
    type: String,
    required: true,
    validate: {
      validator(v) {
        return /[a-f0-9]{32}/.test(v);
      },
      message: 'Invalid hash value for {VALUE}',
    },
  },
  event: {
    type: String,
    required: true,
  },
  ua: {
    type: String,
    required: true,
  },
});
