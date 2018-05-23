const Promise = require('bluebird');
const { Pagination } = require('@limit0/mongoose-graphql-pagination');
const Placement = require('../models/placement');
const PublisherRepo = require('./publisher');
const fixtures = require('../fixtures');
const { buildMultipleEntityNameQuery, paginateSearch, buildMultipleEntityAutocomplete } = require('../elastic/utils');

module.exports = {
  /**
   *
   * @param {object} payload
   * @return {Promise}
   */
  create(payload = {}) {
    const placement = new Placement(payload);
    return placement.save();
  },

  async update(id, payload = {}) {
    if (!id) throw new Error('Unable to update placement: no ID was provided.');
    const placement = await this.findById(id);
    if (!placement) throw new Error(`Unable to update placement: no record was found for ID '${id}'`);

    ['name', 'publisherId'].forEach((key) => {
      const value = payload[key];
      if (typeof value !== 'undefined') placement[key] = value;
    });
    return placement.save();
  },

  /**
   * Find a Placement record by ID.
   *
   * Will return a rejected promise if no ID was provided.
   * Will NOT reject the promise if the record cannnot be found.
   *
   * @param {string} id
   * @return {Promise}
   */
  async findById(id) {
    if (!id) throw new Error('Unable to find placement: no ID was provided.');
    return Placement.findOne({ _id: id });
  },

  /**
   * @param {object} criteria
   * @return {Promise}
   */
  find(criteria) {
    return Placement.find(criteria);
  },

  /**
   * @todo Should this do a cascade removal?
   * @param {string} id
   * @return {Promise}
   */
  removeById(id) {
    if (!id) return Promise.reject(new Error('Unable to remove placement: no ID was provided.'));
    return this.remove({ _id: id });
  },

  /**
   * @param {object} criteria
   * @return {Promise}
   */
  remove(criteria) {
    return Placement.remove(criteria);
  },

  /**
   *
   * @param {number} [count=1]
   * @param {?object} params
   * @return {object}
   */
  generate(count = 1, params) {
    return fixtures(Placement, count, params);
  },

  async seed({ count = 1, publisherCount = 1 } = {}) {
    const publishers = await PublisherRepo.seed({ count: publisherCount });
    const results = this.generate(count, {
      publisherId: () => publishers.random().id,
    });
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
    return new Pagination(Placement, { pagination, sort });
  },

  /**
   * Searches & Paginates all Placement models.
   *
   * @param {string} phrase The search phrase.
   * @param {object} params The search parameters.
   * @param {object.object} params.pagination The pagination parameters.
   * @return {SearchPagination}
   */
  search(phrase, { pagination } = {}) {
    const query = buildMultipleEntityNameQuery(phrase, ['name', 'publisherName']);
    return paginateSearch(Placement, phrase, query, { pagination });
  },

  autocomplete(phrase, { pagination } = {}) {
    const query = buildMultipleEntityAutocomplete(phrase, ['name', 'publisherName']);
    return paginateSearch(Placement, phrase, query, { pagination });
  },
};
