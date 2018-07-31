const { Schema } = require('mongoose');
const connection = require('../connections/mongoose/instance');

const UserReference = {
  type: Schema.Types.ObjectId,
  required: true,
  validate: {
    async validator(id) {
      const doc = await connection.model('user').findById(id, { _id: 1 });
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

  schema.method('setUserContext', function setUserContext({ id }) {
    this.$userContext = { id };
  });

  schema.pre('validate', function setAttribution() {
    if (this.$userContext) {
      const { id } = this.$userContext;
      if (this.isNew) {
        this.set({ createdById: id, updatedById: id });
      } else {
        this.set({ updatedById: id });
      }
    }
  });
};
