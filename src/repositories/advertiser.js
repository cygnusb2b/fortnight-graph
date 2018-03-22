const Promise = require('bluebird');
const Advertiser = require('../models/advertiser');
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
  update(id, { name, logo } = {}) {
    if (!id) return Promise.reject(new Error('Unable to update advertiser: no ID was provided.'));
    const criteria = { _id: id };
    const update = { $set: { name, logo } };
    const options = { new: true, runValidators: true };
    return Advertiser.findOneAndUpdate(criteria, update, options).then((document) => {
      if (!document) throw new Error(`Unable to update advertiser: no record was found for ID '${id}'`);
      return document;
    });
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
   * @return {Pagination}
   */
  paginate({ pagination, sort } = {}) {
    return new Pagination(Advertiser, { pagination, sort });
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
    return new Pagination(Advertiser, { criteria, pagination, sort });
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
