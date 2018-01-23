const User = require('../models/user');
const AccountRepo = require('../repositories/account');
const UserRepo = require('../repositories/user');
const SessionRepo = require('../repositories/session');

module.exports = {
  /**
   *
   */
  Query: {
    ping: () => 'pong',
    currentUser: (root, args, { auth }) => (auth.isValid() ? auth.user : null),
    checkSession: async (root, { input }) => {
      const { token } = input;
      const { user, session } = await UserRepo.retrieveSession(token);
      return { user, session };
    },
    userAccounts: (root, args, { auth }) => (auth.isValid() ? AccountRepo.findByUserId(auth.user.id) : []),
  },
  Mutation: {
    createAccount: (root, { input }, { auth }) => {
      if (!auth.isValid()) throw new Error('Authentication is required.');
      const { payload } = input;
      payload.userIds = [ auth.user.id ];
      return AccountRepo.create(payload);
    },
    createUser: (root, { input }) => {
      const { payload } = input;
      return UserRepo.create(payload);
    },
    loginUser: (root, { input }) => {
      const { email, password } = input;
      return UserRepo.login(email, password);
    },
    deleteSession: async (root, args, { auth }) => {
      if (auth.isValid()) {
        await SessionRepo.delete(auth.session);
      }
      return 'ok';
    },
  },
  User: {
    id: user => user.get('uid'),
    accounts: (user) => {
      const id = user.get('id');
      return AccountRepo.findByUserId(id);
    },
    activeAccount: (user) => {
      const id = user.get('activeAccountId');
      return AccountRepo.findByInternalId(id);
    }
  },
  Account: {
    id: account => account.get('uid'),
    users: (account) => {
      const userIds = account.get('userIds');
      if (!userIds.length) return [];
      return User.find({ _id: { $in: userIds } });
    },
  },
};
