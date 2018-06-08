const Promise = require('bluebird');
const { Pagination } = require('@limit0/mongoose-graphql-pagination');
const Story = require('../models/story');
const fixtures = require('../fixtures');
const { buildMultipleEntityNameQuery, buildEntityAutocomplete, paginateSearch } = require('../elastic/utils');

module.exports = {
  /**
   *
   * @param {object} payload
   * @return {Promise}
   */
  create(payload = {}) {
    const story = new Story(payload);
    return story.save();
  },

  async update(id, payload = {}) {
    if (!id) throw new Error('Unable to update story: no ID was provided.');
    const story = await this.findById(id);
    if (!story) throw new Error(`Unable to update story: no record was found for ID '${id}'`);

    ['title', 'teaser', 'body', 'publishedAt'].forEach((key) => {
      const value = payload[key];
      if (typeof value !== 'undefined') story[key] = value;
    });
    return story.save();
  },

  /**
   * Find a Story record by ID.
   *
   * Will return a rejected promise if no ID was provided.
   * Will NOT reject the promise if the record cannnot be found.
   *
   * @param {string} id
   * @return {Promise}
   */
  findById(id) {
    if (!id) return Promise.reject(new Error('Unable to find story: no ID was provided.'));
    return Story.findOne({ _id: id });
  },

  /**
   * @param {object} criteria
   * @return {Promise}
   */
  find(criteria) {
    return Story.find(criteria);
  },

  /**
   *
   * @param {number} [count=1]
   * @return {object}
   */
  generate(count = 1) {
    return fixtures(Story, count);
  },

  async seed({ count = 1 } = {}) {
    const results = this.generate(count);
    await Promise.all(results.all().map(model => model.save()));
    return results;
  },

  /**
   * Paginates all Template models.
   *
   * @param {object} params
   * @param {object.object} params.pagination The pagination parameters.
   * @param {object.object} params.sort The sort parameters.
   * @return {Pagination}
   */
  paginate({ pagination, sort } = {}) {
    return new Pagination(Story, { pagination, sort });
  },

  /**
   * Searches & Paginates all Story models.
   *
   * @param {string} phrase The search phrase.
   * @param {object} params The search parameters.
   * @param {object.object} params.pagination The pagination parameters.
   * @return {ElasticPagination}
   */
  search(phrase, { pagination } = {}) {
    const query = buildMultipleEntityNameQuery(phrase, ['title', 'advertiserName']);
    return paginateSearch(Story, phrase, query, { pagination });
  },

  autocomplete(phrase, { pagination } = {}) {
    const query = buildEntityAutocomplete(phrase, 'title');
    return paginateSearch(Story, phrase, query, { pagination });
  },

};
