const Promise = require('bluebird');
const AdvertiserRepo = require('../advertiser');
const PlacementRepo = require('../placement');
const Campaign = require('../../models/campaign');
const Contact = require('../../models/contact');
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
  update(id, {
    name,
    url,
    status,
    advertiserId,
    externalLinks,
  } = {}) {
    if (!id) return Promise.reject(new Error('Unable to update campaign: no ID was provided.'));
    const criteria = { _id: id };
    const update = { $set: { name } };
    if (url) update.$set.url = url;
    if (status) update.$set.status = status;
    if (advertiserId) update.$set.advertiserId = advertiserId;
    if (externalLinks) update.$set.externalLinks = externalLinks;
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
   *
   * @param {string} hash
   * @return {Promise}
   */
  findByHash(hash) {
    if (!hash) return Promise.reject(new Error('Unable to find campaign: no hash was provided.'));
    return Campaign.findOne({ hash });
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

  async seed({ count = 1, advertiserCount = 1, placementCount = 1 } = {}) {
    const advertisers = await AdvertiserRepo.seed({ count: advertiserCount });
    const placements = await PlacementRepo.seed({ count: placementCount });
    const results = this.generate(count, {
      advertiserId: () => advertisers.random().id,
      placementId: () => placements.random().id,
    });
    await Promise.all(results.all().map(model => model.save()));
    return results;
  },

  /**
   * @param {string} id
   * @param {string} type
   * @param {string} contactId
   * @return {Promise}
   */
  async addContact(id, type, contactId) {
    if (!['internal', 'external'].includes(type)) throw new Error('Invalid notification type');
    await Contact.findById(contactId);
    const criteria = { _id: id };
    const key = `notify.${type}`;
    const update = { $addToSet: { [key]: contactId } };
    const options = { new: true, runValidators: true };
    return Campaign.findOneAndUpdate(criteria, update, options).then((document) => {
      if (!document) throw new Error(`Unable to update advertiser: no record was found for ID '${id}'`);
      return document;
    });
  },

  /**
   * @param {string} id
   * @param {string} type
   * @param {string} contactId
   * @return {Promise}
   */
  async removeContact(id, type, contactId) {
    if (!['internal', 'external'].includes(type)) throw new Error('Invalid notification type');
    const criteria = { _id: id };
    const key = `notify.${type}`;
    const update = { $pull: { [key]: contactId } };
    const options = { new: true, runValidators: true };
    return Campaign.findOneAndUpdate(criteria, update, options).then((document) => {
      if (!document) throw new Error(`Unable to update advertiser: no record was found for ID '${id}'`);
      return document;
    });
  },
};
