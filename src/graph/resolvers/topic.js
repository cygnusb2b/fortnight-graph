const { paginationResolvers } = require('@limit0/mongoose-graphql-pagination');
const Publisher = require('../../models/publisher');
const Topic = require('../../models/topic');

module.exports = {
  /**
   *
   */
  Topic: {
    publisher: topic => Publisher.findById(topic.publisherId),
  },

  /**
   *
   */
  TopicConnection: paginationResolvers.connection,

  /**
   *
   */
  Query: {
    /**
     *
     */
    topic: (root, { input }, { auth }) => {
      auth.check();
      const { id } = input;
      return Topic.strictFindById(id);
    },

    /**
     *
     */
    allTopics: (root, { pagination, sort }, { auth }) => {
      auth.check();
      return Topic.paginate({ pagination, sort });
    },

    /**
     *
     */
    searchTopics: (root, { pagination, phrase }, { auth }) => {
      auth.check();
      return Topic.search(phrase, { pagination });
    },

    /**
     *
     */
    autocompleteTopics: async (root, { pagination, phrase }, { auth }) => {
      auth.check();
      return Topic.autocomplete(phrase, { pagination });
    },

    autocompletePublisherTopics: async (root, { publisherId, pagination, phrase }, { auth }) => {
      auth.check();
      const postFilter = { term: { publisherId } };
      return Topic.autocomplete(phrase, { pagination, postFilter });
    },
  },

  /**
   *
   */
  Mutation: {
    /**
     *
     */
    createTopic: (root, { input }, { auth }) => {
      auth.check();
      const { payload } = input;
      return Topic.create(payload);
    },

    /**
     *
     */
    updateTopic: async (root, { input }, { auth }) => {
      auth.check();
      const { id, payload } = input;
      return Topic.findAndSetUpdate(id, payload);
    },
  },
};
