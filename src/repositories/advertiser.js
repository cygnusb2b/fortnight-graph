const Promise = require('bluebird');
const Advertiser = require('../models/advertiser');
const Pagination = require('../classes/pagination');
const fixtures = require('../fixtures');

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
  update(id, { name } = {}) {
    if (!id) return Promise.reject(new Error('Unable to update advertiser: no ID was provided.'));
    const criteria = { _id: id };
    const update = { $set: { name } };
    const options = { new: true };
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

  generate(count = 1) {
    return fixtures(Advertiser, count);
  },
};
