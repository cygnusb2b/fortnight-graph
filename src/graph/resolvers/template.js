const TemplateRepo = require('../../repositories/template');
const paginationResolvers = require('./pagination');

module.exports = {
  /**
   *
   */
  TemplateConnection: paginationResolvers.connection,

  /**
   *
   */
  TemplateEdge: paginationResolvers.edge,

  /**
   *
   */
  Query: {
    /**
     *
     */
    template: async (root, { input }, { auth }) => {
      auth.check();
      const { id } = input;
      const record = await TemplateRepo.findById(id);
      if (!record) throw new Error(`No template record found for ID ${id}.`);
      return record;
    },

    /**
     *
     */
    allTemplates: (root, { pagination, sort }, { auth }) => {
      auth.check();
      return TemplateRepo.paginate({ pagination, sort });
    },

    /**
     *
     */
    searchTemplates: async (root, { pagination, phrase }, { auth }) => {
      auth.check();
      return TemplateRepo.search(phrase, { pagination });
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
      return TemplateRepo.create(payload);
    },

    /**
     *
     */
    updateTemplate: (root, { input }, { auth }) => {
      auth.check();
      const { id, payload } = input;
      return TemplateRepo.update(id, payload);
    },
  },
};
