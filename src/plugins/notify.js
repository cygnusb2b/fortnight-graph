const mongoose = require('mongoose');
const Contact = require('../models/contact');

const { Schema } = mongoose;

module.exports = function contactPlugin(schema) {
  const ContactReference = {
    type: Schema.Types.ObjectId,
    required: true,
    validate: {
      async validator(v) {
        const doc = await Contact.findOne({ _id: v }, { _id: 1 });
        if (doc) return true;
        return false;
      },
      message: 'No contact found for ID {VALUE}',
    },
  };

  schema.add({
    notify: {
      internal: [ContactReference],
      external: [ContactReference],
    },
  });
};
