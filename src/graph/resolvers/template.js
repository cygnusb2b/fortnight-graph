const { paginationResolvers } = require('@limit0/mongoose-graphql-pagination');
const Template = require('../../models/template');

module.exports = {
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
      return Template.strictFindById(id);
    },

    /**
     *
     */
    allTemplates: (root, { pagination, sort }, { auth }) => {
      auth.check();
      return Template.paginate({ pagination, sort });
    },

    /**
     *
     */
    searchTemplates: (root, { pagination, phrase }, { auth }) => {
      auth.check();
      return Template.search(phrase, { pagination });
    },

    /**
     *
     */
    autocompleteTemplates: (root, { pagination, phrase }, { auth }) => {
      auth.check();
      return Template.autocomplete(phrase, { pagination });
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
    updateTemplate: (root, { input }, { auth }) => {
      auth.check();
      const { id, payload } = input;
      return Template.findAndSetUpdate(id, payload);
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
