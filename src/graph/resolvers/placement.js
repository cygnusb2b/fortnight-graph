const { paginationResolvers } = require('@limit0/mongoose-graphql-pagination');
const Placement = require('../../models/placement');
const Publisher = require('../../models/publisher');
const Template = require('../../models/template');
const Topic = require('../../models/topic');

module.exports = {
  /**
   *
   */
  Placement: {
    publisher: placement => Publisher.findById(placement.publisherId),
    topic: placement => Topic.findById(placement.topicId),
    template: placement => Template.findById(placement.templateId),
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
    placement: (root, { input }, { auth }) => {
      auth.check();
      const { id } = input;
      return Placement.strictFindById(id);
    },

    /**
     *
     */
    allPlacements: (root, { pagination, sort }, { auth }) => {
      auth.check();
      return Placement.paginate({ pagination, sort });
    },

    /**
     *
     */
    searchPlacements: (root, { pagination, phrase }, { auth }) => {
      auth.check();
      return Placement.search(phrase, { pagination });
    },

    /**
     *
     */
    autocompletePlacements: async (root, { pagination, phrase }, { auth }) => {
      auth.check();
      return Placement.autocomplete(phrase, { pagination });
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
      const placement = await Placement.strictFindById(id);
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
