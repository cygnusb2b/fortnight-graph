const AccountService = require('../../services/account');

module.exports = {
  Query: {
    account: () => AccountService.retrieve(),
  },
};
