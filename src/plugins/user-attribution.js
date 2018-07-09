const { Schema } = require('mongoose');
const connection = require('../connections/mongoose/instance');

const UserReference = {
  type: Schema.Types.ObjectId,
  required: true,
  validate: {
    async validator(v) {
      const doc = await connection.model('user').findOne({ _id: v }, { _id: 1 });
      if (doc) return true;
      return false;
    },
    message: 'No user found for ID {VALUE}',
  },
};

module.exports = function userAttributionPlugin(schema) {
  schema.add({
    createdById: UserReference,
    updatedById: UserReference,
  });
};
