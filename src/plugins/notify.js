const { Schema } = require('mongoose');
const connection = require('../connections/mongoose/instance');

const ContactReference = {
  type: Schema.Types.ObjectId,
  required: true,
  validate: {
    async validator(v) {
      const doc = await connection.model('contact').findOne({ _id: v }, { _id: 1 });
      if (doc) return true;
      return false;
    },
    message: 'No contact found for ID {VALUE}',
  },
};

module.exports = function contactPlugin(schema) {
  schema.add({
    notify: {
      internal: [ContactReference],
      external: [ContactReference],
    },
  });
};
