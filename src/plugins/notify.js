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

const getIds = (doc, fieldName) => {
  const value = doc.get(fieldName);
  return Array.isArray(value) ? value : [];
};

module.exports = function notifyPlugin(schema) {
  schema.add({
    notify: {
      internal: [ContactReference],
      external: [ContactReference],
    },
  });

  schema.method('addContactId', function addContactId(type, contactId) {
    const fieldName = `notify.${type}`;
    const ids = getIds(this, fieldName);

    const current = ids.map(id => `${id}`);
    current.push(`${contactId}`);
    this.set(fieldName, [...new Set(current)]);
  });

  schema.method('removeContactId', function removeContactId(type, contactId) {
    const fieldName = `notify.${type}`;
    const ids = getIds(this, fieldName);

    const filtered = ids.filter(id => `${id}` !== `${contactId}`);
    this.set(fieldName, filtered);
  });

  schema.method('addInternalContactId', function addInternalContactId(contactId) {
    this.addContactId('internal', contactId);
  });

  schema.method('addExternalContactId', function addExternalContactId(contactId) {
    this.addContactId('external', contactId);
  });

  schema.method('removeInternalContactId', function removeInternalContactId(contactId) {
    this.removeContactId('internal', contactId);
  });

  schema.method('removeExternalContactId', function removeExternalContactId(contactId) {
    this.removeContactId('external', contactId);
  });

  schema.method('removeContactIdAll', function removeContactIdAll(contactId) {
    this.removeContactId('internal', contactId);
    this.removeContactId('external', contactId);
  });
};
