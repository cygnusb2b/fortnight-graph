const Promise = require('bluebird');
const { Pagination } = require('@limit0/mongoose-graphql-pagination');
const AdvertiserRepo = require('../advertiser');
const PlacementRepo = require('../placement');
const Campaign = require('../../models/campaign');
const fixtures = require('../../fixtures');
const { buildMultipleEntityNameQuery, paginateSearch } = require('../../elastic/utils');

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
  async update(id, {
    name,
    description,
    url,
    status,
    advertiserId,
    externalLinks,
  } = {}) {
    if (!id) throw new Error('Unable to update campaign: no ID was provided.');
    const campaign = await this.findById(id);
    if (!campaign) throw new Error(`Unable to update campaign: no record was found for ID '${id}'`);

    campaign.name = name;
    if (url) campaign.url = url;
    if (description) campaign.description = description;
    if (status) campaign.status = status;
    if (advertiserId) campaign.advertiserId = advertiserId;
    if (externalLinks) campaign.externalLinks = externalLinks;
    return campaign.save();
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
   * Searches & Paginates all Campaign models.
   *
   * @param {string} phrase The search phrase.
   * @param {object} params The search parameters.
   * @param {object.object} params.pagination The pagination parameters.
   * @return {ElasticPagination}
   */
  search(phrase, { pagination } = {}) {
    const query = buildMultipleEntityNameQuery(phrase, ['name', 'advertiserName']);
    return paginateSearch(Campaign, phrase, query, { pagination });
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
};
