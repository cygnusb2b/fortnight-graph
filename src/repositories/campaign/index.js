const Promise = require('bluebird');
const { Pagination } = require('@limit0/mongoose-graphql-pagination');
const Campaign = require('../../models/campaign');
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
};
