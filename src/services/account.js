const Account = require('../models/account');

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
   * Gets the account key.
   */
  getKey() {
    const { ACCOUNT_KEY } = process.env;
    return ACCOUNT_KEY;
  },

};
