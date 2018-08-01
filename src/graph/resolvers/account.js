const Account = require('../../models/account');
const AccountService = require('../../services/account');

module.exports = {
  /**
   *
   */
  Query: {
    account: () => AccountService.retrieve(),
  },

  /**
   *
   */
  Mutation: {
    /**
     *
     */
    updateAccount: async (root, { input }, { auth }) => {
      auth.checkAdmin();
      const { id, payload } = input;
      const account = await Account.strictFindById(id);
      account.set(payload);
      return account.save();
    },
  },
};
