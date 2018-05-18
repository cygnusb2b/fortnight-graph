const PublisherRepo = require('../../repositories/publisher');
const paginationResolvers = require('./pagination');

module.exports = {
  /**
   *
   */
  PublisherConnection: paginationResolvers.connection,

  /**
   *
   */
  PublisherEdge: paginationResolvers.edge,

  /**
   *
   */
  Query: {
    /**
     *
     */
    publisher: async (root, { input }, { auth }) => {
      auth.check();
      const { id } = input;
      const record = await PublisherRepo.findById(id);
      if (!record) throw new Error(`No publisher record found for ID ${id}.`);
      return record;
    },

    /**
     *
     */
    allPublishers: (root, { pagination, sort }, { auth }) => {
      auth.check();
      return PublisherRepo.paginate({ pagination, sort });
    },

    /**
     *
     */
    searchPublishers: (root, { pagination, phrase }, { auth }) => {
      auth.check();
      return PublisherRepo.search(phrase, { pagination });
    },

    /**
     *
     */
    autocompletePublishers: async (root, { pagination, phrase }, { auth }) => {
      auth.check();
      return PublisherRepo.autocomplete(phrase, { pagination });
    },
  },

  /**
   *
   */
  Mutation: {
    /**
     *
     */
    createPublisher: (root, { input }, { auth }) => {
      auth.check();
      const { payload } = input;
      return PublisherRepo.create(payload);
    },

    /**
     *
     */
    updatePublisher: (root, { input }, { auth }) => {
      auth.check();
      const { id, payload } = input;
      return PublisherRepo.update(id, payload);
    },
  },
};
