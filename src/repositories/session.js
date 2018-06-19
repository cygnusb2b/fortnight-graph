const Promise = require('bluebird');
const jwt = require('jsonwebtoken');
const uuidv4 = require('uuid/v4');
const uuidv5 = require('uuid/v5');
const bcrypt = require('bcrypt');
const accountService = require('../services/account');
const redis = require('../redis');

const getSettings = async () => {
  const account = await accountService.retrieve();
  const { settings } = account;
  const { session } = settings || {};
  const { globalSecret, namespace, expiration } = session || {};
  if (!globalSecret || !namespace || !expiration) {
    throw new Error('The account session settings are invalid!');
  }
  return { globalSecret, namespace, expiration };
};

const createSessionId = async ({ uid, ts }) => {
  const { namespace } = await getSettings();
  return uuidv5(`${uid}.${ts}`, namespace);
};

const createSecret = async ({ userSecret }) => {
  const { globalSecret } = await getSettings();
  return `${userSecret}.${globalSecret}`;
};

module.exports = {
  getClient() {
    return redis;
  },

  /**
   *
   * @param {object} params
   * @param {string} params.id
   * @param {string} params.uid
   * @return {Promise}
   */
  async delete({ id, uid }) {
    const sessionPrefix = await this.prefixSessionId(id);
    const userPrefix = await this.prefixUserId(uid);

    const delSession = this.getClient().delAsync(sessionPrefix);
    const removeId = this.getClient().sremAsync(userPrefix, id);
    return Promise.join(delSession, removeId);
  },

  /**
   *
   * @param {string} token
   * @return {Promise}
   */
  async get(token) {
    if (!token) throw new Error('Unable to get session: no token was provided.');
    const parsed = await jwt.decode(token, { complete: true, force: true });
    if (!parsed) throw new Error('Unable to get session: invalid token format.');
    const sessionPrefix = await this.prefixSessionId(parsed.payload.jti);
    const result = await this.getClient().getAsync(sessionPrefix);

    if (!result) throw new Error('Unable to get session: no token found in storage.');

    const session = Object(JSON.parse(result));
    const sid = await createSessionId(session);
    const secret = await createSecret({ userSecret: session.s });
    const verified = jwt.verify(token, secret, { jwtid: sid, algorithms: ['HS256'] });

    // Return the public session.
    return {
      id: sid,
      uid: session.uid,
      cre: verified.iat,
      exp: verified.exp,
      token,
    };
  },

  /**
   *
   * @param {object} params
   * @param {string} params.uid
   * @return {Promise}
   */
  async set({ uid }) {
    if (!uid) throw new Error('The user ID is required.');

    const now = new Date();
    const iat = Math.floor(now.valueOf() / 1000);

    const userSecret = await bcrypt.hash(uuidv4(), 5);
    const { expiration } = await getSettings();

    const ts = now.valueOf();
    const sid = await createSessionId({ uid, ts });
    const exp = iat + Number(expiration);
    const secret = await createSecret({ userSecret });
    const token = jwt.sign({ jti: sid, exp, iat }, secret);

    const payload = JSON.stringify({
      id: sid,
      ts,
      uid,
      s: userSecret,
    });
    const sessionPrefix = await this.prefixSessionId(sid);
    await this.getClient().setexAsync(sessionPrefix, expiration, payload);

    const memberKey = await this.prefixUserId(uid);
    const addUserId = this.getClient().saddAsync(memberKey, sid);
    const updateExpires = this.getClient().expireAsync(memberKey, expiration);
    await Promise.join(addUserId, updateExpires);

    // Return the public session.
    return {
      id: sid,
      uid,
      cre: iat,
      exp,
      token,
    };
  },

  async prefixSessionId(id) {
    const { key } = await accountService.retrieve();
    return `session:${key}:id:${id}`;
  },

  async prefixUserId(uid) {
    const { key } = await accountService.retrieve();
    return `session:${key}:uid:${uid}`;
  },

};
