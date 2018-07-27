const AccountService = require('../../services/account');
const Publisher = require('../../models/Publisher');

module.exports = {
  Query: {
    account: (root, args, { hostname }) => AccountService.retrieve(),
  },
};
