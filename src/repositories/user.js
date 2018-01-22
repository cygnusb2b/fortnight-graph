const bcrypt = require('bcrypt');
const sessionRepo = require('./session');
const User = require('../models/user');

module.exports = {
  create(payload) {
    // @todo Need to send email verification email.
    const user = new User(payload);
    return user.save();
  },

  /**
   *
   * @param {string} email
   * @return {Promise}
   */
  findByEmail(email) {
    const normalized = String(email).trim().toLowerCase();
    return User.findOne({ email: normalized });
  },

  /**
   *
   * @param {string} id
   * @return {Promise}
   */
  findByInternalId(id) {
    return User.findOne({ _id: id });
  },

  /**
   *
   * @param {string} uid
   * @return {Promise}
   */
  findByUID(uid) {
    return User.findOne({ uid });
  },

  /**
   *
   * @param {string} email
   * @param {string} password
   * @return {Promise}
   */
  async login(email, password) {
    // @todo Need to determine whether email address is verified!
    // Or does that get handled elsewhere?

    // Load user from database.
    const user = await this.findByEmail(email);
    if (!user) throw new Error('No user was found for the provided email address.');

    // Verify password.
    await this.verifyPassword(password, user.get('password'));

    // Create session.
    const session = await sessionRepo.set({ uid: user.uid });

    // Update login info (but don't wait)
    this.updateLoginInfo(user);
    return { user, session };
  },

  async retrieveSession(token) {
    const session = await sessionRepo.get(token);
    // Ensure user still exists/refresh the user data.
    const user = await this.findByUID(session.uid);
    if (!user) throw new Error('The provided user could not be found.');
    return { user, session };
  },

  /**
   *
   * @param {string} clear
   * @param {string} encoded
   * @return {Promise}
   */
  async verifyPassword(clear, encoded) {
    const valid = await bcrypt.compare(clear, encoded);
    if (!valid) throw new Error('The provided password was incorrect.');
    return valid;
  },

  /**
   *
   * @param {User} user
   * @return {Promise}
   */
  updateLoginInfo(user) {
    const logins = user.get('logins') || 0;
    user.set('logins', logins + 1);
    user.set('lastLoggedInAt', new Date());
    return user.save();
  },
};
