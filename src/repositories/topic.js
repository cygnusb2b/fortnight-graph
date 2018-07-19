const PublisherRepo = require('./publisher');
const Topic = require('../models/topic');
const fixtures = require('../fixtures');

module.exports = {
  /**
   *
   * @param {number} [count=1]
   * @param {?object} params
   * @return {object}
   */
  generate(count = 1, params) {
    return fixtures(Topic, count, params);
  },

  /**
   *
   * @param {*} param0
   */
  async seed({ count = 1, publisherCount = 1 } = {}) {
    const publishers = await PublisherRepo.seed({ count: publisherCount });
    const results = this.generate(count, {
      publisherId: () => publishers.random().id,
    });
    await Promise.all(results.all().map(model => model.save()));
    return results;
  },
};
