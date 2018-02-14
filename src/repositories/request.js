const Promise = require('bluebird');
const Request = require('../models/request');
const PlacementRepo = require('./placement');
const CampaignRepo = require('./campaign');
const fixtures = require('../fixtures');

module.exports = {
  /**
   * @param {object} criteria
   * @return {Promise}
   */
  remove(criteria) {
    return Request.remove(criteria);
  },

  /**
   *
   * @param {number} [count=1]
   * @param {?object} params
   * @return {object}
   */
  generate(count = 1, params) {
    return fixtures(Request, count, params);
  },

  async seed({ count = 1 } = {}) {
    const placement = await PlacementRepo.seed();
    const campaign = await CampaignRepo.seed();

    const results = this.generate(count, {
      pid: () => placement.one().id,
      cid: () => campaign.one().id,
    });
    await Promise.all(results.all().map(model => model.save()));
    return results;
  },
};
