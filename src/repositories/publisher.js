const Promise = require('bluebird');
const Publisher = require('../models/publisher');
const Pagination = require('../classes/pagination');
const fixtures = require('../fixtures');
const TypeAhead = require('../classes/type-ahead');

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

  update(id, payload = {}) {
    if (!id) return Promise.reject(new Error('Unable to update publisher: no ID was provided.'));
    const criteria = { _id: id };
    const $set = {};
    ['name'].forEach((key) => {
      const value = payload[key];
      if (typeof value !== 'undefined') $set[key] = value;
    });
    const options = { new: true, runValidators: true };
    return Publisher.findOneAndUpdate(criteria, { $set }, options).then((document) => {
      if (!document) throw new Error(`Unable to update publisher: no record was found for ID '${id}'`);
      return document;
    });
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
   * Searches & Paginates all Advertiser models.
   *
   * @param {object} params
   * @param {object.object} params.pagination The pagination parameters.
   * @param {object.object} params.search The search parameters.
   * @return {Pagination}
   */
  search({ pagination, search } = {}) {
    const { typeahead } = search;
    const { criteria, sort } = TypeAhead.getCriteria(typeahead);
    return new Pagination(Publisher, { criteria, pagination, sort });
  },
};
