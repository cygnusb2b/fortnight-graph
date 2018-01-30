const UserRepo = require('../../repositories/user');
const SessionRepo = require('../../repositories/session');

module.exports = {
  /**
   *
   */
  User: {
    id: user => user.get('uid'),
  },

  /**
   *
   */
  Query: {
    /**
     *
     */
    currentUser: (root, args, { auth }) => (auth.isValid() ? auth.user : null),

    /**
     *
     */
    checkSession: async (root, { input }) => {
      const { token } = input;
      const { user, session } = await UserRepo.retrieveSession(token);
      return { user, session };
    },
  },
  Mutation: {
    /**
     *
     */
    createUser: (root, { input }) => {
      const { payload } = input;
      return UserRepo.create(payload);
    },

    /**
     *
     */
    loginUser: (root, { input }) => {
      const { email, password } = input;
      return UserRepo.login(email, password);
    },

    /**
     *
     */
    deleteSession: async (root, args, { auth }) => {
      if (auth.isValid()) {
        await SessionRepo.delete(auth.session);
      }
      return 'ok';
    },
  },
};
