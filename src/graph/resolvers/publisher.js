const { paginationResolvers } = require('@limit0/mongoose-graphql-pagination');
const userAttributionFields = require('./user-attribution');
const Campaign = require('../../models/campaign');
const Image = require('../../models/image');
const Placement = require('../../models/placement');
const Publisher = require('../../models/publisher');
const Topic = require('../../models/topic');

module.exports = {
  /**
   *
   */
  Publisher: {
    logo: publisher => Image.findById(publisher.logoImageId),
    topics: (publisher, { pagination, sort }) => {
      const criteria = { publisherId: publisher.id, deleted: false };
      return Topic.paginate({ criteria, pagination, sort });
    },
    placements: (publisher, { pagination, sort }) => {
      const criteria = { publisherId: publisher.id, deleted: false };
      return Placement.paginate({ criteria, pagination, sort });
    },
    campaigns: async (publisher, { pagination, sort }) => {
      const placements = await Placement.find({ publisherId: publisher.id }, { _id: 1 });
      const placementIds = placements.map(placement => placement.id);
      const criteria = { 'criteria.placementIds': { $in: placementIds }, deleted: false };
      return Campaign.paginate({ criteria, pagination, sort });
    },
    ...userAttributionFields,
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
      return Publisher.strictFindActiveById(id);
    },

    /**
     *
     */
    allPublishers: (root, { pagination, sort }, { auth }) => {
      auth.check();
      const criteria = { deleted: false };
      return Publisher.paginate({ criteria, pagination, sort });
    },

    /**
     *
     */
    searchPublishers: (root, { pagination, phrase }, { auth }) => {
      auth.check();
      const filter = { term: { deleted: false } };
      return Publisher.search(phrase, { pagination, filter });
    },

    /**
     *
     */
    autocompletePublishers: (root, { pagination, phrase }, { auth }) => {
      auth.check();
      const filter = { term: { deleted: false } };
      return Publisher.autocomplete(phrase, { pagination, filter });
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

    /**
     *
     */
    deletePublisher: async (root, { input }, { auth }) => {
      auth.check();
      const { id } = input;
      const publisher = await Publisher.strictFindActiveById(id);
      await publisher.softDelete();
      return 'ok';
    },
  },
};
