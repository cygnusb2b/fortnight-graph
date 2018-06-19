const { paginationResolvers } = require('@limit0/mongoose-graphql-pagination');
const Publisher = require('../../models/publisher');
const Image = require('../../models/image');
const PublisherRepo = require('../../repositories/publisher');

module.exports = {
  /**
   *
   */
  Publisher: {
    logo: publisher => Image.findById(publisher.logoImageId),
  },

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

    /**
     *
     */
    publisherLogo: async (root, { input }, { auth }) => {
      auth.check();
      const { id, imageId } = input;
      const publisher = await Publisher.findById(id);
      if (!publisher) throw new Error(`Unable to set publisher logo: no record found for ID ${id}.`);
      publisher.logoImageId = imageId;
      return publisher.save();
    },
  },
};
