const Promise = require('bluebird');
const Campaign = require('../../models/campaign');
const Pagination = require('../../classes/pagination');
const fixtures = require('../../fixtures');

module.exports = {
  /**
   *
   * @param {object} payload
   * @return {Promise}
   */
  create(payload = {}) {
    const campaign = new Campaign(payload);
    return campaign.save();
  },

  /**
   *
   * @param {string} cid
   * @param {object} payload
   * @param {string} payload.name
   * @param {string} payload.advertiserId
   * @return {Promise}
   */
  update(id, { name } = {}) {
    if (!id) return Promise.reject(new Error('Unable to update campaign: no ID was provided.'));
    const criteria = { _id: id };
    const update = { $set: { name } };
    const options = { new: true, runValidators: true };
    return Campaign.findOneAndUpdate(criteria, update, options).then((document) => {
      if (!document) throw new Error(`Unable to update campaign: no record was found for ID '${id}'`);
      return document;
    });
  },

  /**
   *
   * @param {string} id
   * @return {Promise}
   */
  findById(id) {
    if (!id) return Promise.reject(new Error('Unable to find campaign: no ID was provided.'));
    return Campaign.findOne({ _id: id });
  },

  /**
   * @param {object} criteria
   * @return {Promise}
   */
  find(criteria) {
    return Campaign.find(criteria);
  },

  /**
   * Finds Campaigns for the provided Advertiser ID.
   *
   * @param {string} id
   * @return {Promise}
   */
  findForAdvertiser(id) {
    return Campaign.find({ advertiserId: id });
  },

  /**
   * @param {string} id
   * @return {Promise}
   */
  removeById(id) {
    if (!id) return Promise.reject(new Error('Unable to remove campaign: no ID was provided.'));
    return this.remove({ _id: id });
  },

  /**
   * @param {object} criteria
   * @return {Promise}
   */
  remove(criteria) {
    return Campaign.remove(criteria);
  },

  /**
   * Paginates all Campaign models.
   *
   * @param {object} params
   * @param {object.object} params.pagination The pagination parameters.
   * @param {object.object} params.sort The sort parameters.
   * @return {Pagination}
   */
  paginate({ pagination, sort } = {}) {
    return new Pagination(Campaign, { pagination, sort });
  },

  /**
   *
   * @param {number} [count=1]
   * @param {?object} params
   * @return {object}
   */
  generate(count = 1, params) {
    return fixtures(Campaign, count, params);
  },
};
