const { DateType, CursorType } = require('./custom-types');
const UserRepo = require('../repositories/user');
const SessionRepo = require('../repositories/session');
const ImageRepo = require('../repositories/image');
const AdvertiserRepo = require('../repositories/advertiser');
const CampaignRepo = require('../repositories/campaign');
const Advertiser = require('../models/advertiser');
const Campaign = require('../models/campaign');
const Publisher = require('../models/publisher');
const Pagination = require('../classes/pagination');

const checkAuth = (auth) => {
  if (!auth.isValid()) throw auth.getError();
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

const updateModel = ({ input, updator }, auth) => {
  checkAuth(auth);
  return updator(input);
};

module.exports = {
  /**
   *
   */
  Date: DateType,
  Cursor: CursorType,

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
    allAdvertisers: (root, { pagination, sort }, { auth }) => {
      checkAuth(auth);
      return new Pagination(Advertiser, { pagination, sort });
    },
    /**
     *
     */
    allCampaigns: (root, { pagination, sort }, { auth }) => {
      checkAuth(auth);
      return new Pagination(Campaign, { pagination, sort });
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
    updateAdvertiser: (root, { input }, { auth }) => {
      const updator = AdvertiserRepo.update;
      return updateModel({ input, updator }, auth);
    },
    /**
     *
     */
    createCampaign: (root, { input }, { auth }) => {
      const creator = CampaignRepo.create;
      return createModel({ input, creator }, auth);
    },
    /**
     *
     */
    updateCampaign: (root, { input }, { auth }) => {
      const updator = CampaignRepo.update;
      return updateModel({ input, updator }, auth);
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
    /**
     *
     */
    addCampaignCreative: async (root, args, { auth }) => {
      checkAuth(auth);
      return CampaignRepo.addCreative(args);
    },
    /**
     *
     */
    // updateCampaignCreative: async (root, args, { auth }) => {
    //   checkAuth(auth);
    //   return CampaignRepo.updateCreative(args);
    // },
    /**
     *
     */
    removeCampaignCreative: async (root, args, { auth }) => {
      checkAuth(auth);
      return CampaignRepo.removeCreative(args);
    },
  },
  Advertiser: {
    campaigns: advertiser => Campaign.find({ advertiserId: advertiser.get('id') }),
    campaignCount: advertiser => Campaign.count({ advertiserId: advertiser.get('id') }),
  },
  /**
   *
   */
  Campaign: {
    id: campaign => campaign.get('cid'),
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

  AdvertiserConnection: {
    totalCount: paginated => paginated.getTotalCount(),
    edges: paginated => paginated.getEdges(),
    pageInfo: paginated => ({
      hasNextPage: () => paginated.hasNextPage(),
      endCursor: () => paginated.getEndCursor(),
    }),
  },

  AdvertiserEdge: {
    node: document => document,
    cursor: document => document.get('id'),
  },

  CampaignConnection: {
    totalCount: paginated => paginated.getTotalCount(),
    edges: paginated => paginated.getEdges(),
    pageInfo: paginated => ({
      hasNextPage: () => paginated.hasNextPage(),
      endCursor: () => paginated.getEndCursor(),
    }),
  },

  CampaignEdge: {
    node: document => document,
    cursor: document => document.get('id'),
  },
};

