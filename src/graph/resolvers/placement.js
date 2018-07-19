const { paginationResolvers } = require('@limit0/mongoose-graphql-pagination');
const PlacementRepo = require('../../repositories/placement');
const Placement = require('../../models/placement');
const Publisher = require('../../models/publisher');
const Topic = require('../../models/topic');

module.exports = {
  /**
   *
   */
  Placement: {
    publisher: placement => Publisher.findById(placement.publisherId),
    topic: placement => Topic.findById(placement.topicId),
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
      const record = await Placement.findById(id);
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
      const {
        name,
        publisherId,
        templateId,
        topicId,
      } = payload;
      return Placement.create({
        name,
        publisherId,
        templateId,
        topicId,
      });
    },

    /**
     *
     */
    updatePlacement: async (root, { input }, { auth }) => {
      auth.check();
      const { id, payload } = input;
      const placement = await Placement.findById(id);
      if (!placement) throw new Error(`No placement found for ID ${id}.`);
      const {
        name,
        publisherId,
        templateId,
        topicId,
      } = payload;
      placement.set({
        name,
        publisherId,
        templateId,
        topicId,
      });
      return placement.save();
    },
  },
};
