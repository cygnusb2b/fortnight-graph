const { paginationResolvers } = require('@limit0/mongoose-graphql-pagination');
const Image = require('../../models/image');
const Publisher = require('../../models/publisher');

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
    publisher: (root, { input }, { auth }) => {
      auth.check();
      const { id } = input;
      return Publisher.strictFindById(id);
    },

    /**
     *
     */
    allPublishers: (root, { pagination, sort }, { auth }) => {
      auth.check();
      return Publisher.paginate({ pagination, sort });
    },

    /**
     *
     */
    searchPublishers: (root, { pagination, phrase }, { auth }) => {
      auth.check();
      return Publisher.search(phrase, { pagination });
    },

    /**
     *
     */
    autocompletePublishers: (root, { pagination, phrase }, { auth }) => {
      auth.check();
      return Publisher.autocomplete(phrase, { pagination });
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
    updatePublisher: (root, { input }, { auth }) => {
      auth.check();
      const { id, payload } = input;
      return Publisher.findAndSetUpdate(id, payload);
    },

    /**
     *
     */
    publisherLogo: async (root, { input }, { auth }) => {
      auth.check();
      const { id, imageId } = input;
      const publisher = await Publisher.strictFindById(id);
      publisher.logoImageId = imageId;
      return publisher.save();
    },
  },
};
