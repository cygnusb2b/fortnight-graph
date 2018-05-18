const Promise = require('bluebird');
const Advertiser = require('../models/advertiser');
const Pagination = require('../classes/pagination');
const SearchPagination = require('../classes/elastic/pagination');
const elastic = require('../elastic');
const fixtures = require('../fixtures');
const { buildEntityNameQuery, buildEntityAutocomplete, paginateSearch } = require('../elastic/utils');

module.exports = {
  /**
   *
   * @param {object} payload
   * @return {Promise}
   */
  create(payload = {}) {
    const advertiser = new Advertiser(payload);
    return advertiser.save();
  },

  /**
   *
   * @param {string} id
   * @param {object} payload
   * @param {string} payload.name
   * @return {Promise}
   */
  async update(id, { name, logo } = {}) {
    if (!id) throw new Error('Unable to update advertiser: no ID was provided.');
    const advertiser = await this.findById(id);
    if (!advertiser) throw new Error(`Unable to update advertiser: no record was found for ID '${id}'`);
    advertiser.set({ name, logo });
    return advertiser.save();
  },

  /**
   * Find an Advertiser record by ID.
   *
   * Will return a rejected promise if no ID was provided.
   * Will NOT reject the promise if the record cannnot be found.
   *
   * @param {string} id
   * @return {Promise}
   */
  findById(id) {
    if (!id) return Promise.reject(new Error('Unable to find advertiser: no ID was provided.'));
    return Advertiser.findOne({ _id: id });
  },

  /**
   * @param {object} criteria
   * @return {Promise}
   */
  find(criteria) {
    return Advertiser.find(criteria);
  },

  /**
   * @param {string} id
   * @return {Promise}
   */
  removeById(id) {
    if (!id) return Promise.reject(new Error('Unable to remove advertiser: no ID was provided.'));
    return this.remove({ _id: id });
  },

  /**
   * @param {object} criteria
   * @return {Promise}
   */
  remove(criteria) {
    return Advertiser.remove(criteria);
  },

  /**
   * Paginates all Advertiser models.
   *
   * @param {object} params
   * @param {object.object} params.pagination The pagination parameters.
   * @param {object.object} params.sort The sort parameters.
   * @param {object.object} params.criteria Additional query criteria to apply.
   * @return {Pagination}
   */
  paginate({ pagination, sort, criteria } = {}) {
    return new Pagination(Advertiser, { pagination, sort, criteria });
  },

  /**
   * Searches & Paginates all Advertiser models.
   *
   * @param {string} phrase The search phrase.
   * @param {object} params The search parameters.
   * @param {object.object} params.pagination The pagination parameters.
   * @return {SearchPagination}
   */
  search(phrase, { pagination } = {}) {
    const query = buildEntityNameQuery(phrase);
    return paginateSearch(Advertiser, phrase, query, { pagination });
  },

  autocomplete(phrase, { pagination } = {}) {
    const query = buildEntityAutocomplete(phrase);
    return paginateSearch(Advertiser, phrase, query, { pagination });
  },

  /**
   *
   * @param {number} [count=1]
   * @return {object}
   */
  generate(count = 1) {
    return fixtures(Advertiser, count);
  },

  async seed({ count = 1 } = {}) {
    const results = this.generate(count);
    await Promise.all(results.all().map(model => model.save()));
    return results;
  },
};
