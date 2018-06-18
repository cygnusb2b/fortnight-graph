const Promise = require('bluebird');
const jwt = require('jsonwebtoken');
const uuidv4 = require('uuid/v4');
const uuidv5 = require('uuid/v5');
const bcrypt = require('bcrypt');
const redis = require('../redis');

const { SESSION_GLOBAL_SECRET, SESSION_NAMESPACE, SESSION_EXPIRATION } = process.env;

function createSessionId({ uid, ts }) {
  return uuidv5(`${uid}.${ts}`, SESSION_NAMESPACE);
}

function createSecret({ userSecret }) {
  return `${userSecret}.${SESSION_GLOBAL_SECRET}`;
}

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
  delete({ id, uid }) {
    const delSession = this.getClient().delAsync(this.prefixSessionId(id));
    const removeId = this.getClient().sremAsync(this.prefixUserId(uid), id);
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
    const result = await this.getClient().getAsync(this.prefixSessionId(parsed.payload.jti));

    if (!result) throw new Error('Unable to get session: no token found in storage.');

    const session = Object(JSON.parse(result));
    const sid = createSessionId(session);
    const secret = createSecret({ userSecret: session.s });
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

    const ts = now.valueOf();
    const sid = createSessionId({ uid, ts });
    const exp = iat + SESSION_EXPIRATION;
    const secret = createSecret({ userSecret });
    const token = jwt.sign({ jti: sid, exp, iat }, secret);

    const payload = JSON.stringify({
      id: sid,
      ts,
      uid,
      s: userSecret,
    });
    await this.getClient().setexAsync(this.prefixSessionId(sid), SESSION_EXPIRATION, payload);

    const memberKey = this.prefixUserId(uid);
    const addUserId = this.getClient().saddAsync(memberKey, sid);
    const updateExpires = this.getClient().expireAsync(memberKey, SESSION_EXPIRATION);
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

  prefixSessionId(id) {
    return `session:id:${id}`;
  },

  prefixUserId(uid) {
    return `session:uid:${uid}`;
  },

};
