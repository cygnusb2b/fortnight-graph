const PublisherRepo = require('../../repositories/publisher');
const PlacementRepo = require('../../repositories/placement');
const paginationResolvers = require('./pagination');

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
  PlacementEdge: paginationResolvers.edge,

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
