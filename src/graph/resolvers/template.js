const { paginationResolvers } = require('@limit0/mongoose-graphql-pagination');
const userAttributionFields = require('./user-attribution');
const Template = require('../../models/template');

module.exports = {
  /**
   *
   */
  Template: {
    ...userAttributionFields,
  },

  /**
   *
   */
  TemplateConnection: paginationResolvers.connection,

  /**
   *
   */
  Query: {
    /**
     *
     */
    template: (root, { input }, { auth }) => {
      auth.check();
      const { id } = input;
      return Template.strictFindActiveById(id);
    },

    /**
     *
     */
    allTemplates: (root, { pagination, sort }, { auth }) => {
      auth.check();
      const criteria = { deleted: false };
      return Template.paginate({ criteria, pagination, sort });
    },

    /**
     *
     */
    searchTemplates: (root, { pagination, phrase }, { auth }) => {
      auth.check();
      const filter = { term: { deleted: false } };
      return Template.search(phrase, { pagination, filter });
    },

    /**
     *
     */
    autocompleteTemplates: (root, { pagination, phrase }, { auth }) => {
      auth.check();
      const filter = { term: { deleted: false } };
      return Template.autocomplete(phrase, { pagination, filter });
    },
  },

  /**
   *
   */
  Mutation: {
    /**
     *
     */
    createTemplate: (root, { input }, { auth }) => {
      auth.check();
      const { payload } = input;
      return Template.create(payload);
    },

    /**
     *
     */
    updateTemplate: async (root, { input }, { auth }) => {
      auth.check();
      const { id, payload } = input;
      const template = await Template.strictFindActiveById(id);
      template.set(payload);
      return template.save();
    },

    /**
     *
     */
    deleteTemplate: async (root, { input }, { auth }) => {
      auth.check();
      const { id } = input;
      const template = await Template.strictFindActiveById(id);
      await template.softDelete();
      return 'ok';
    },
  },
};
