const Promise = require('bluebird');
const Publisher = require('../models/publisher');
const Pagination = require('../classes/pagination');
const fixtures = require('../fixtures');
const { buildEntityNameQuery, buildEntityAutocomplete, paginateSearch } = require('../elastic/utils');

module.exports = {
  /**
   *
   * @param {object} payload
   * @return {Promise}
   */
  create(payload = {}) {
    const publisher = new Publisher(payload);
    return publisher.save();
  },

  async update(id, payload = {}) {
    if (!id) throw new Error('Unable to update publisher: no ID was provided.');
    const publisher = await this.findById(id);
    if (!publisher) throw new Error(`Unable to update publisher: no record was found for ID '${id}'`);

    ['name', 'logo'].forEach((key) => {
      const value = payload[key];
      if (typeof value !== 'undefined') publisher[key] = value;
    });
    return publisher.save();
  },

  /**
   * Find a Publisher record by ID.
   *
   * Will return a rejected promise if no ID was provided.
   * Will NOT reject the promise if the record cannnot be found.
   *
   * @param {string} id
   * @return {Promise}
   */
  findById(id) {
    if (!id) return Promise.reject(new Error('Unable to find publisher: no ID was provided.'));
    return Publisher.findOne({ _id: id });
  },

  /**
   * @param {object} criteria
   * @return {Promise}
   */
  find(criteria) {
    return Publisher.find(criteria);
  },

  /**
   * @todo Should this do a cascade removal?
   * @param {string} id
   * @return {Promise}
   */
  removeById(id) {
    if (!id) return Promise.reject(new Error('Unable to remove publisher: no ID was provided.'));
    return this.remove({ _id: id });
  },

  /**
   * @param {object} criteria
   * @return {Promise}
   */
  remove(criteria) {
    return Publisher.remove(criteria);
  },

  /**
   *
   * @param {number} [count=1]
   * @return {object}
   */
  generate(count = 1) {
    return fixtures(Publisher, count);
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
    return new Pagination(Publisher, { pagination, sort });
  },

  /**
   * Searches & Paginates all Publisher models.
   *
   * @param {string} phrase The search phrase.
   * @param {object} params The search parameters.
   * @param {object.object} params.pagination The pagination parameters.
   * @return {SearchPagination}
   */
  search(phrase, { pagination } = {}) {
    const query = buildEntityNameQuery(phrase);
    return paginateSearch(Publisher, phrase, query, { pagination });
  },

  autocomplete(phrase, { pagination } = {}) {
    const query = buildEntityAutocomplete(phrase);
    return paginateSearch(Publisher, phrase, query, { pagination });
  },
};
