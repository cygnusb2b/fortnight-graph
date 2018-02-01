const Advertiser = require('../models/advertiser');
const Pagination = require('../classes/pagination');

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
   * @param {object} params
   * @param {string} params.id
   * @param {string} params.name
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
};
