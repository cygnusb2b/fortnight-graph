const Account = require('../../models/account');
const AccountService = require('../../services/account');
const env = require('../../env');

module.exports = {
  /**
   *
   */
  AccountSettings: {
    cname: () => env.STORY_HOST,
    googleAnalyticsId: () => env.GA_TRACKING_ID,
    siteVerificationMeta: () => env.GOOGLE_SITE_VERIFICATION,
  },

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
