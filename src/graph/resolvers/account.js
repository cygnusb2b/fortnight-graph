const Account = require('../../models/account');
const AccountService = require('../../services/account');
const {
  STORY_HOST,
  GTM_CONTAINER_ID,
  GA_TRACKING_ID,
  GOOGLE_SITE_VERIFICATION,
} = require('../../env');

module.exports = {
  /**
   *
   */
  AccountSettings: {
    cname: () => STORY_HOST,
    siteVerificationMeta: () => GOOGLE_SITE_VERIFICATION,
  },

  AccountGlobals: {
    GTM_CONTAINER_ID: () => GTM_CONTAINER_ID,
    GA_TRACKING_ID: () => GA_TRACKING_ID,
  },

  Account: {
    globals: () => ({}),
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
      const { name, settings } = payload;
      account.name = name;
      account.set('settings.reservePct', settings.reservePct);
      account.set('settings.requiredCreatives', settings.requiredCreatives);
      if (settings.googleTagManagerId) account.set('settings.googleTagManagerId', settings.googleTagManagerId);
      return account.save();
    },
  },
};
