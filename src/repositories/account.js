const Account = require('../models/account');

module.exports = {

  /**
   *
   * @param {*} payload
   */
  create(payload) {
    const account = new Account(payload);
    return account.save();
  },

  /**
   *
   * @param {string} id
   * @return {Promise}
   */
  findByInternalId(id) {
    return Account.findOne({ _id: id });
  },

  /**
   *
   * @param {string} uid
   * @return {Promise}
   */
  findByUID(uid) {
    return Account.findOne({ uid });
  },

  /**
   *
   * @param {string} uid
   * @return {Promise}
   */
  findByUserId(userIds) {
    return Account.find({ userIds });
  },

};
