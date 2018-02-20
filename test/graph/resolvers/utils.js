const sinon = require('sinon');
const bcrypt = require('bcrypt');
const { graphql } = require('graphql');
const schema = require('../../../src/graph/schema');
const Auth = require('../../../src/classes/auth');
const UserRepo = require('../../../src/repositories/user');
const SessionRepo = require('../../../src/repositories/session');

const sandbox = sinon.createSandbox();

const passwords = { valid: 'test-password', invalid: 'bad-password' };

let authentication;
const getAuth = async () => {
  if (!authentication) {
    const model = UserRepo.generate().one();
    model.set('password', passwords.valid);
    await model.save();

    const { user, session } = await UserRepo.login(model.email, passwords.valid);
    authentication = new Auth({ user, session });
  }
  return authentication;
};

const logOut = async () => {
  const { session } = await getAuth();
  await SessionRepo.delete(session);
  authentication = undefined;
};

const buildContext = async ({ loggedIn } = {}) => {
  const auth = (loggedIn) ? await getAuth() : new Auth();
  return { auth };
};

module.exports = {
  passwords,
  async setup() {
    const hash = '$2a$04$cNQWR.nWZp.DCUYGC6M8n.HQ2jHd/L.nFHCGoSXvre4lSniiC/3Gi';
    sandbox.stub(bcrypt, 'hash').resolves(hash);
    sandbox.stub(bcrypt, 'compare')
      .withArgs(passwords.valid, hash).resolves(true)
      .withArgs(passwords.invalid, hash).resolves(false)
    ;
    await UserRepo.remove();
    await getAuth();
  },
  async teardown() {
    sandbox.restore();
    await logOut();
    await UserRepo.remove();
  },
  async graphql({ query, variables, key, loggedIn }) {
    const contextValue = await buildContext({ loggedIn });
    return graphql({ schema, source: query, variableValues: variables, contextValue })
      .then((response) => {
        if (response.errors) throw response.errors[0];
        return response.data[key];
      });
  },
  getAuth,
  logOut,
  getType(name) {
    return schema._typeMap[name];
  },

}
