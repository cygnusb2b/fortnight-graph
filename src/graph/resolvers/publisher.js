const { paginationResolvers } = require('@limit0/mongoose-graphql-pagination');
const Publisher = require('../../models/publisher');
const PublisherRepo = require('../../repositories/publisher');

module.exports = {
  /**
   *
   */
  PublisherConnection: paginationResolvers.connection,

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
      const record = await Publisher.findById(id);
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
      return Publisher.create(payload);
    },

    /**
     *
     */
    updatePublisher: async (root, { input }, { auth }) => {
      auth.check();
      const { id, payload } = input;
      const publisher = await Publisher.findById(id);
      if (!publisher) throw new Error(`Unable to update publisher: no record found for ID ${id}.`);
      publisher.set(payload);
      return publisher.save();
    },
  },
};
