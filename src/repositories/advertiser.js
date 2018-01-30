const Advertiser = require('../models/advertiser');

module.exports = {
  /**
   *
   * @param {object} payload
   * @return {Promise}
   */
  create(payload) {
    const advertiser = new Advertiser(payload);
    return advertiser.save();
  },

  /**
   *
   * @param {string} id
   * @param {string} name
   * @return {Promise}
   */
  update({ id, name }) {
    const criteria = { _id: id };
    const update = { $set: { name } };
    const options = { new: true };
    return Advertiser.findOneAndUpdate(criteria, update, options);
  },

  /**
   *
   * @param {string} id
   * @return {Promise}
   */
  findById(id) {
    return Advertiser.findOne({ _id: id }).then((document) => {
      if (!document) throw new Error(`No advertiser found for id '${id}'`);
      return document;
    });
  },
};
