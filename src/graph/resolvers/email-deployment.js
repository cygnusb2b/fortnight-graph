const { paginationResolvers } = require('@limit0/mongoose-graphql-pagination');
const userAttributionFields = require('./user-attribution');
const EmailDeployment = require('../../models/email-deployment');
const EmailPlacement = require('../../models/email-placement');
const Publisher = require('../../models/publisher');

module.exports = {
  /**
   *
   */
  EmailDeployment: {
    publisher: ({ publisherId }) => Publisher.findById(publisherId),
    placements: async (deployment, { pagination, sort }) => {
      const criteria = { deploymentId: deployment.id, deleted: false };
      return EmailPlacement.paginate({ criteria, pagination, sort });
    },
    ...userAttributionFields,
  },

  /**
   *
   */
  EmailDeploymentConnection: paginationResolvers.connection,

  /**
   *
   */
  Mutation: {
    /**
     *
     */
    createEmailDeployment: (_, { input }, { auth }) => {
      auth.check();
      const { payload } = input;
      const deployment = new EmailDeployment(payload);
      deployment.setUserContext(auth.user);
      return deployment.save();
    },

    /**
     *
     */
    deleteEmailDeployment: async (_, { input }, { auth }) => {
      auth.check();
      const { id } = input;
      const deployment = await EmailDeployment.strictFindActiveById(id);
      deployment.setUserContext(auth.user);
      await deployment.softDelete();
      return 'ok';
    },

    /**
     *
     */
    updateEmailDeployment: async (_, { input }, { auth }) => {
      auth.check();
      const { id, payload } = input;
      const deployment = await EmailDeployment.strictFindActiveById(id);
      deployment.setUserContext(auth.user);
      deployment.set(payload);
      return deployment.save();
    },
  },

  /**
   *
   */
  Query: {
    /**
     *
     */
    allEmailDeployments: (_, { pagination, sort }, { auth }) => {
      auth.check();
      const criteria = { deleted: false };
      return EmailDeployment.paginate({ criteria, pagination, sort });
    },

    /**
     *
     */
    autocompleteEmailDeployments: (_, { pagination, phrase }, { auth }) => {
      auth.check();
      const filter = { term: { deleted: false } };
      return EmailDeployment.autocomplete(phrase, { pagination, filter });
    },

    /**
     *
     */
    emailDeployment: (_, { input }, { auth }) => {
      auth.check();
      const { id } = input;
      return EmailDeployment.strictFindActiveById(id);
    },

    /**
     *
     */
    searchEmailDeployments: (_, { pagination, phrase }, { auth }) => {
      auth.check();
      const filter = { term: { deleted: false } };
      return EmailDeployment.search(phrase, { pagination, filter });
    },
  },
};
