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
      const { name, campaignId, emailPlacementId } = input;
      const lineItem = new EmailLineItem({ name, campaignId, emailPlacementId });
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

    /**
     *
     */
    emailLineItemDateDays: async (_, { input }, { auth }) => {
      auth.check();
      const { id, days } = input;
      const doc = await EmailLineItem.strictFindActiveById(id);
      doc.setUserContext(auth.user);
      doc.set({
        dates: {
          type: 'days',
          days,
          start: undefined,
          end: undefined,
        },
      });
      return doc.save();
    },

    /**
     *
     */
    emailLineItemDateRange: async (_, { input }, { auth }) => {
      auth.check();
      const { id, start, end } = input;
      const doc = await EmailLineItem.strictFindActiveById(id);
      doc.setUserContext(auth.user);
      doc.set({
        dates: {
          type: 'range',
          days: undefined,
          start,
          end,
        },
      });
      return doc.save();
    },
  },
};
