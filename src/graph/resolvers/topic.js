const { paginationResolvers, Pagination } = require('@limit0/mongoose-graphql-pagination');
const Publisher = require('../../models/publisher');
const Topic = require('../../models/topic');
const { buildMultipleEntityNameQuery, paginateSearch, buildMultipleEntityAutocomplete } = require('../../elastic/utils');

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
    topic: async (root, { input }, { auth }) => {
      auth.check();
      const { id } = input;
      const record = await Topic.findById(id);
      if (!record) throw new Error(`No topic record found for ID ${id}.`);
      return record;
    },

    /**
     *
     */
    allTopics: (root, { pagination, sort }, { auth }) => {
      auth.check();
      return new Pagination(Topic, { pagination, sort });
    },

    /**
     *
     */
    searchTopics: (root, { pagination, phrase }, { auth }) => {
      auth.check();
      const query = buildMultipleEntityNameQuery(phrase, ['name', 'publisherName']);
      return paginateSearch(Topic, phrase, query, { pagination });
    },

    /**
     *
     */
    autocompleteTopics: async (root, { pagination, phrase }, { auth }) => {
      auth.check();
      const query = buildMultipleEntityAutocomplete(phrase, ['name', 'publisherName']);
      return paginateSearch(Topic, phrase, query, { pagination });
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
      const topic = await Topic.findById(id);
      if (!topic) throw new Error(`No topic record found for ID ${id}.`);
      topic.set(payload);
      return topic.save();
    },
  },
};
