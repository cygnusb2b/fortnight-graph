const { paginationResolvers } = require('@limit0/mongoose-graphql-pagination');
const userAttributionFields = require('./user-attribution');
const { Campaign, EmailLineItem, EmailPlacement } = require('../../models');

module.exports = {
  /**
   *
   */
  EmailLineItem: {
    campaign: ({ campaignId }) => Campaign.findById(campaignId),
    placement: ({ emailPlacementId }) => EmailPlacement.findById(emailPlacementId),
    ...userAttributionFields,
  },

  /**
   *
   */
  EmailLineItemConnection: paginationResolvers.connection,

  /**
   *
   */
  Mutation: {
    /**
     *
     */
    createEmailLineItem: (_, { input }, { auth }) => {
      auth.check();
      const { campaignId, emailPlacementId } = input;
      const lineItem = new EmailLineItem({ campaignId, emailPlacementId });
      lineItem.setUserContext(auth.user);
      return lineItem.save();
    },

    /**
     *
     */
    deleteEmailLineItem: async (_, { input }, { auth }) => {
      auth.check();
      const { id } = input;
      const lineItem = await EmailLineItem.strictFindActiveById(id);
      lineItem.setUserContext(auth.user);
      await lineItem.softDelete();
      return 'ok';
    },
  },
};
