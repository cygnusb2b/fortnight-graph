const { paginationResolvers } = require('@limit0/mongoose-graphql-pagination');
const Contact = require('../../models/contact');

module.exports = {
  /**
   *
   */
  ContactConnection: paginationResolvers.connection,

  /**
   *
   */
  Query: {
    /**
     *
     */
    contact: (root, { input }, { auth }) => {
      auth.check();
      const { id } = input;
      return Contact.strictFindById(id);
    },

    /**
     *
     */
    allContacts: (root, { pagination, sort }, { auth }) => {
      auth.check();
      return Contact.paginate({ pagination, sort });
    },

    /**
     *
     */
    searchContacts: (root, { pagination, phrase }, { auth }) => {
      auth.check();
      return Contact.search(phrase, { pagination });
    },

    /**
     *
     */
    autocompleteContacts: (root, { pagination, phrase }, { auth }) => {
      auth.check();
      return Contact.autocomplete(phrase, { pagination });
    },
  },

  /**
   *
   */
  Mutation: {
    /**
     *
     */
    createContact: (root, { input }, { auth }) => {
      auth.check();
      const { payload } = input;
      return Contact.create(payload);
    },

    /**
     *
     */
    updateContact: (root, { input }, { auth }) => {
      auth.check();
      const { id, payload } = input;
      return Contact.findAndSetUpdate(id, payload);
    },

    /**
     *
     */
    deleteContact: async (root, { input }, { auth }) => {
      auth.check();
      const { id } = input;
      const contact = await Contact.strictFindActiveById(id);
      await contact.softDelete();
      return 'ok';
    },
  },
};
