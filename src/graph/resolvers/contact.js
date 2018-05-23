const { paginationResolvers } = require('@limit0/mongoose-graphql-pagination');
const ContactRepo = require('../../repositories/contact');

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
    contact: async (root, { input }, { auth }) => {
      auth.check();
      const { id } = input;
      const record = await ContactRepo.findById(id);
      if (!record) throw new Error(`No contact record found for ID ${id}.`);
      return record;
    },

    /**
     *
     */
    allContacts: (root, { pagination, sort }, { auth }) => {
      auth.check();
      return ContactRepo.paginate({ pagination, sort });
    },

    /**
     *
     */
    searchContacts: (root, { pagination, phrase }, { auth }) => {
      auth.check();
      return ContactRepo.search(phrase, { pagination });
    },

    /**
     *
     */
    autocompleteContacts: (root, { pagination, phrase }, { auth }) => {
      auth.check();
      return ContactRepo.autocomplete(phrase, { pagination });
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
      return ContactRepo.create(payload);
    },

    /**
     *
     */
    updateContact: (root, { input }, { auth }) => {
      auth.check();
      const { id, payload } = input;
      return ContactRepo.update(id, payload);
    },
  },
};
