const { paginationResolvers } = require('@limit0/mongoose-graphql-pagination');
const userAttributionFields = require('./user-attribution');
const EmailDeployment = require('../../models/email-deployment');
const EmailPlacement = require('../../models/email-placement');

module.exports = {
  /**
   *
   */
  EmailPlacement: {
    emailDeployment: ({ deploymentId }) => EmailDeployment.findById(deploymentId),
    ...userAttributionFields,
  },

  /**
   *
   */
  EmailPlacementConnection: paginationResolvers.connection,

  /**
   *
   */
  Mutation: {
    /**
     *
     */
    createEmailPlacement: (_, { input }, { auth }) => {
      auth.check();
      const { payload } = input;
      const placement = new EmailPlacement(payload);
      placement.setUserContext(auth.user);
      return placement.save();
    },

    /**
     *
     */
    deleteEmailPlacement: async (_, { input }, { auth }) => {
      auth.check();
      const { id } = input;
      const placement = await EmailPlacement.strictFindActiveById(id);
      placement.setUserContext(auth.user);
      await placement.softDelete();
      return 'ok';
    },

    /**
     *
     */
    updateEmailPlacement: async (_, { input }, { auth }) => {
      auth.check();
      const { id, payload } = input;
      const placement = await EmailPlacement.strictFindActiveById(id);
      placement.setUserContext(auth.user);
      placement.set(payload);
      return placement.save();
    },
  },

  /**
   *
   */
  Query: {
    /**
     *
     */
    allEmailPlacements: (_, { pagination, sort }, { auth }) => {
      auth.check();
      const criteria = { deleted: false };
      return EmailPlacement.paginate({ criteria, pagination, sort });
    },

    /**
     *
     */
    autocompleteEmailPlacements: (_, { pagination, phrase }, { auth }) => {
      auth.check();
      const filter = { term: { deleted: false } };
      return EmailPlacement.autocomplete(phrase, { pagination, filter });
    },

    /**
     *
     */
    emailPlacement: (_, { input }, { auth }) => {
      auth.check();
      const { id } = input;
      return EmailPlacement.strictFindActiveById(id);
    },

    /**
     *
     */
    searchEmailPlacements: (_, { pagination, phrase }, { auth }) => {
      auth.check();
      const filter = { term: { deleted: false } };
      return EmailPlacement.search(phrase, { pagination, filter });
    },
  },
};
