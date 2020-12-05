const { paginationResolvers } = require('@limit0/mongoose-graphql-pagination');
const userAttributionFields = require('./user-attribution');
const { Campaign, EmailPlacement } = require('../../models');

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
};
