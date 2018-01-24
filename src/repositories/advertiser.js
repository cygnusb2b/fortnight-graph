const Advertiser = require('../models/advertiser');

module.exports = {
  create(payload) {
    const advertiser = new Advertiser(payload);
    return advertiser.save();
  },

  /**
   *
   * @param {string} id
   * @return {Promise}
   */
  findById(id) {
    return Advertiser.findOne({ _id: id });
  },
};
