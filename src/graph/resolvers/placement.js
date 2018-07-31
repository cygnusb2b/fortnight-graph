const { paginationResolvers } = require('@limit0/mongoose-graphql-pagination');
const userAttributionFields = require('./user-attribution');
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
    ...userAttributionFields,
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
      return Placement.strictFindActiveById(id);
    },

    /**
     *
     */
    allPlacements: (root, { pagination, sort }, { auth }) => {
      auth.check();
      const criteria = { deleted: false };
      return Placement.paginate({ criteria, pagination, sort });
    },

    /**
     *
     */
    searchPlacements: (root, { pagination, phrase }, { auth }) => {
      auth.check();
      const filter = { term: { deleted: false } };
      return Placement.search(phrase, { pagination, filter });
    },

    /**
     *
     */
    autocompletePlacements: async (root, { pagination, phrase }, { auth }) => {
      auth.check();
      const filter = { term: { deleted: false } };
      return Placement.autocomplete(phrase, { pagination, filter });
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
        reservePct,
      } = payload;
      return Placement.create({
        name,
        publisherId,
        templateId,
        topicId,
        reservePct,
      });
    },

    /**
     *
     */
    updatePlacement: async (root, { input }, { auth }) => {
      auth.check();
      const { id, payload } = input;
      const placement = await Placement.strictFindActiveById(id);
      const {
        name,
        publisherId,
        templateId,
        topicId,
        reservePct,
      } = payload;
      placement.set({
        name,
        publisherId,
        templateId,
        topicId,
        reservePct,
      });
      return placement.save();
    },

    /**
     *
     */
    deletePlacement: async (root, { input }, { auth }) => {
      auth.check();
      const { id } = input;
      const placement = await Placement.strictFindActiveById(id);
      await placement.softDelete();
      return 'ok';
    },
  },
};
