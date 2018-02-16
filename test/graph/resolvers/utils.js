const { graphql } = require('graphql');
const schema = require('../../../src/graph/schema');
const Auth = require('../../../src/classes/auth');
const UserRepo = require('../../../src/repositories/user');
const SessionRepo = require('../../../src/repositories/session');

let authentication;
const getAuth = async () => {
  if (!authentication) {
    const model = UserRepo.generate().one();
    const password = model.password;
    await model.save();

    const { user, session } = await UserRepo.login(model.email, password);
    authentication = new Auth({ user, session });
    authentication.cleartext = password;
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
