const bcrypt = require('bcrypt');
const Promise = require('bluebird');
const sessionRepo = require('./session');
const User = require('../models/user');

module.exports = {
  create(payload = {}) {
    const user = new User(payload);
    return user.save();
  },

  /**
   *
   * @param {string} email
   * @return {Promise}
   */
  findByEmail(email) {
    const value = this.normalizeEmail(email);
    if (!value) return Promise.reject(new Error('Unable to find user: no email address was provided.'));
    return User.findOne({ email: value });
  },

  normalizeEmail(email) {
    if (!email) return '';
    return String(email).trim().toLowerCase();
  },

  /**
   *
   * @param {string} id
   * @return {Promise}
   */
  findById(id) {
    if (!id) return Promise.reject(new Error('Unable to find user: no ID was provided.'));
    return User.findOne({ _id: id });
  },

  removeByEmail(email) {
    const value = this.normalizeEmail(email);
    if (!value) return Promise.reject(new Error('Unable to remove user: no email address was provided.'));
    return this.remove({ email: value });
  },

  remove(criteria) {
    return User.remove(criteria);
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
    if (!password) throw new Error('Unable to login user. No password was provided.');

    // Load user from database.
    const user = await this.findByEmail(email);
    if (!user) throw new Error('No user was found for the provided email address.');

    // Verify password.
    await this.verifyPassword(password, user.get('password'));

    // Create session.
    const session = await sessionRepo.set({ uid: user.id });

    // Update login info
    await this.updateLoginInfo(user);
    return { user, session };
  },

  async retrieveSession(token) {
    const session = await sessionRepo.get(token);
    // Ensure user still exists/refresh the user data.
    const user = await this.findById(session.uid);
    if (!user) throw new Error('Unable to retrieve session: the provided user could not be found.');
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
    user.set('logins', user.get('logins') + 1);
    user.set('lastLoggedInAt', new Date());
    return user.save();
  },
};
