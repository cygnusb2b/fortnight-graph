const ContactRepo = require('../../repositories/contact');
const paginationResolvers = require('./pagination');

module.exports = {
  /**
   *
   */
  ContactConnection: paginationResolvers.connection,

  /**
   *
   */
  ContactEdge: paginationResolvers.edge,

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
    searchContacts: (root, { pagination, search }, { auth }) => {
      auth.check();
      return ContactRepo.search({ pagination, search });
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
