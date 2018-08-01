const { paginationResolvers } = require('@limit0/mongoose-graphql-pagination');
const User = require('../../models/user');
const UserRepo = require('../../repositories/user');
const SessionRepo = require('../../repositories/session');

const validatePassword = (value, confirm) => {
  if (!value || !confirm) throw new Error('You must provide and confirm your password.');
  if (value.length < 6) throw new Error('Passwords must be at least six characters long.');
  if (value !== confirm) throw new Error('The password does not match the confirmation password.');
};

module.exports = {
  /**
   *
   */
  UserConnection: paginationResolvers.connection,

  /**
   *
   */
  Query: {
    /**
     *
     */
    user: (root, { input }, { auth }) => {
      auth.check();
      const { id } = input;
      return User.strictFindById(id);
    },

    /**
     *
     */
    allUsers: (root, { pagination, sort }, { auth }) => {
      auth.check();
      return User.paginate({ pagination, sort });
    },

    /**
     *
     */
    searchUsers: (root, { pagination, phrase }, { auth }) => {
      auth.check();
      return User.search(phrase, { pagination });
    },

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
  /**
   *
   */
  Mutation: {
    /**
     *
     */
    createUser: (root, { input }, { auth }) => {
      auth.check();
      const { payload } = input;
      const {
        email,
        givenName,
        familyName,
        password,
        confirmPassword,
      } = payload;
      validatePassword(password, confirmPassword);
      return UserRepo.create({
        email,
        givenName,
        familyName,
        password,
      });
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

    /**
     *
     */
    changeUserPassword: async (root, { input }, { auth }) => {
      auth.check();
      const { user } = auth;
      const { id, value, confirm } = input;
      if (user.id.valueOf() === id || auth.isAdmin()) {
        validatePassword(value, confirm);
        const record = await User.findActiveById(id);
        if (!record) throw new Error(`No user record found for ID ${id}.`);
        record.password = value;
        return record.save();
      }
      throw new Error('Only administrators can change passwords for other users.');
    },

    /**
     *
     */
    updateCurrentUserProfile: async (root, { input }, { auth }) => {
      auth.check();
      const { givenName, familyName } = input;
      const { user } = auth;
      user.set({ givenName, familyName });
      return user.save();
    },

    /**
     *
     */
    deleteUser: async (root, { input }, { auth }) => {
      auth.check();
      const { id } = input;
      const user = await User.strictFindById(id);
      return user.softDelete();
    },
  },
};
