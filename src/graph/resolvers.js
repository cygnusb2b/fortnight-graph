const UserRepo = require('../repositories/user');
const SessionRepo = require('../repositories/session');
const ImageRepo = require('../repositories/image');
const AdvertiserRepo = require('../repositories/advertiser');
const Advertiser = require('../models/advertiser');
const Publisher = require('../models/publisher');
const { GraphQLScalarType } = require('graphql');
const { Kind } = require('graphql/language');

const checkAuth = (auth) => {
  if (!auth.isValid()) throw auth.getError();
};

const findModels = async ({
  page = 1,
  size = 20,
  sort = '',
} = {}, finder, auth) => {
  checkAuth(auth);
  const pg = page > 1 ? page : 1;
  const limit = size >= 1 && size <= 200 ? size : 20;
  const skip = (pg - 1) * limit;
  return finder({}, null, { limit, skip, sort });
};

const findModelById = async ({ input, finder }, auth) => {
  checkAuth(auth);
  const { id } = input;
  const model = await finder(id);
  if (!model) throw new Error(`No record found for id '${id}'`);
  return model;
};

const createModel = ({ input, creator }, auth) => {
  checkAuth(auth);
  return creator(input);
};

module.exports = {
  /**
   *
   */
  Date: new GraphQLScalarType({
    name: 'Date',
    description: 'Date custom scalar type',
    parseValue(value) {
      return new Date(value); // value from the client
    },
    serialize(value) {
      return value.getTime(); // value sent to the client
    },
    parseLiteral(ast) {
      if (ast.kind === Kind.INT) {
        return parseInt(ast.value, 10); // ast value is always in string format
      }
      return null;
    },
  }),
  /**
   *
   */
  Query: {
    /**
     *
     */
    ping: () => 'pong',
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
    /**
     *
     */
    signImageUpload: (root, { input }) => {
      const accept = ['image/jpeg', 'image/png', 'image/webm', 'image/gif'];
      const { name, type } = input;
      if (!accept.includes(type)) {
        throw new Error(`The requested file type '${type}' is not supported.`);
      }
      return ImageRepo.signUpload(name);
    },
    /**
     *
     */
    advertiser: (root, { input }, { auth }) => {
      const finder = AdvertiserRepo.findById;
      return findModelById({ input, finder }, auth);
    },
    /**
     *
     */
    allAdvertisers: (root, { pagination }, { auth }) => {
      const finder = Advertiser.find.bind(Advertiser);
      return findModels(pagination, finder, auth);
    },
  },
  /**
   *
   */
  Mutation: {
    /**
     *
     */
    createAdvertiser: (root, { input }, { auth }) => {
      const creator = AdvertiserRepo.create;
      return createModel({ input, creator }, auth);
    },
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
  /**
   *
   */
  Campaign: {
    id: campaign => campaign.get('cid'),
    // @todo Project the query based the advertiser fields requested
    advertiser: campaign => Advertiser.findOne({ _id: campaign.get('advertiserId') }),
  },
  /**
   *
   */
  Placement: {
    id: placement => placement.get('pid'),
    publisher: placement => Publisher.findOne({ _id: placement.get('publisherId') }),
  },
  /**
   *
   */
  User: {
    id: user => user.get('uid'),
  },
};
