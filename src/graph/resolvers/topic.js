const { paginationResolvers } = require('@limit0/mongoose-graphql-pagination');
const Publisher = require('../../models/publisher');
const Topic = require('../../models/topic');
const Placement = require('../../models/placement');

module.exports = {
  /**
   *
   */
  Topic: {
    publisher: topic => Publisher.findById(topic.publisherId),
    placements: (topic, { pagination, sort }) => {
      const criteria = { topicId: topic.id };
      return Placement.paginate({ criteria, pagination, sort });
    },
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
      return Topic.strictFindActiveById(id);
    },

    /**
     *
     */
    allTopics: (root, { pagination, sort }, { auth }) => {
      auth.check();
      const criteria = { deleted: false };
      return Topic.paginate({ criteria, pagination, sort });
    },

    /**
     *
     */
    searchTopics: (root, { pagination, phrase }, { auth }) => {
      auth.check();
      const filter = { term: { deleted: false } };
      return Topic.search(phrase, { pagination, filter });
    },

    /**
     *
     */
    autocompleteTopics: async (root, { pagination, phrase }, { auth }) => {
      auth.check();
      const filter = { term: { deleted: false } };
      return Topic.autocomplete(phrase, { pagination, filter });
    },

    autocompletePublisherTopics: async (root, { publisherId, pagination, phrase }, { auth }) => {
      auth.check();
      const postFilter = { term: { publisherId } };
      const filter = { term: { deleted: false } };
      return Topic.autocomplete(phrase, { pagination, postFilter, filter });
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
      const topic = await Topic.strictFindActiveById(id);
      topic.set(payload);
    },

    /**
     *
     */
    deleteTopic: async (root, { input }, { auth }) => {
      auth.check();
      const { id } = input;
      const topic = await Topic.strictFindActiveById(id);
      await topic.softDelete();
      return 'ok';
    },
  },
};
