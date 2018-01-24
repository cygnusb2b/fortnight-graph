const UserRepo = require('../repositories/user');
const SessionRepo = require('../repositories/session');
const ImageRepo = require('../repositories/image');

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
    signImageUpload: (root, { input }) => {
      const accept = ['image/jpeg', 'image/png', 'image/webm', 'image/gif'];
      const { name, type } = input;
      if (!accept.includes(type)) {
        throw new Error(`The requested file type '${type}' is not supported.`);
      }
      return ImageRepo.signUpload(name);
    },
  },
  Mutation: {
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
  },
};
