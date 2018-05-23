const { paginationResolvers } = require('@limit0/mongoose-graphql-pagination');
const PublisherRepo = require('../../repositories/publisher');
const PlacementRepo = require('../../repositories/placement');

module.exports = {
  /**
   *
   */
  Placement: {
    publisher: placement => PublisherRepo.findById(placement.get('publisherId')),
  },

  /**
   *
   */
  PlacementConnection: paginationResolvers.connection,

  /**
   *
   */
  Query: {
    /**
     *
     */
    placement: async (root, { input }, { auth }) => {
      auth.check();
      const { id } = input;
      const record = await PlacementRepo.findById(id);
      if (!record) throw new Error(`No placement record found for ID ${id}.`);
      return record;
    },

    /**
     *
     */
    allPlacements: (root, { pagination, sort }, { auth }) => {
      auth.check();
      return PlacementRepo.paginate({ pagination, sort });
    },

    /**
     *
     */
    searchPlacements: (root, { pagination, phrase }, { auth }) => {
      auth.check();
      return PlacementRepo.search(phrase, { pagination });
    },

    /**
     *
     */
    autocompletePlacements: async (root, { pagination, phrase }, { auth }) => {
      auth.check();
      return PlacementRepo.autocomplete(phrase, { pagination });
    },
  },

  /**
   *
   */
  Mutation: {
    /**
     *
     */
    createPlacement: (root, { input }, { auth }) => {
      auth.check();
      const { payload } = input;
      return PlacementRepo.create(payload);
    },

    /**
     *
     */
    updatePlacement: (root, { input }, { auth }) => {
      auth.check();
      const { id, payload } = input;
      return PlacementRepo.update(id, payload);
    },
  },
};
