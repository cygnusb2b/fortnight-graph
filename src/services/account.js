const objectPath = require('object-path');
const Account = require('../models/account');
const env = require('../env');

let promise;

module.exports = {
  /**
   * Retrieves the account from the database using its key.
   */
  retrieve() {
    const run = async () => {
      const key = this.getKey();
      if (!key) throw new Error('Unable to retrieve account: no account key was set.');
      const account = await Account.findOne({ key });
      if (!account) throw new Error(`No account found for key '${key}'`);
      return account;
    };
    if (!promise) {
      promise = run();
    }
    return promise;
  },

  /**
   * Retrieves an account setting.
   *
   * @param {string} path A dot-notated object path/key.
   */
  async setting(path) {
    const account = await this.retrieve();
    const { settings } = account;
    return objectPath.get(settings, path);
  },

  /**
   * Gets the account key.
   */
  getKey() {
    const { ACCOUNT_KEY } = env;
    return ACCOUNT_KEY;
  },
};
