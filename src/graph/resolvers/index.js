const deepAssign = require('deep-assign');
const { DateType, CursorType } = require('@limit0/graphql-custom-types');
const GraphQLJSON = require('graphql-type-json');
const MixedType = require('../types/mixed');

const account = require('./account');
const advertiser = require('./advertiser');
const campaign = require('./campaign');
const contact = require('./contact');
const dashboard = require('./dashboard');
const emailDeployment = require('./email-deployment');
const emailPlacement = require('./email-placement');
const image = require('./image');
const placement = require('./placement');
const publisher = require('./publisher');
const report = require('./report');
const story = require('./story');
const template = require('./template');
const topic = require('./topic');
const user = require('./user');

module.exports = deepAssign(
  account,
  advertiser,
  campaign,
  contact,
  dashboard,
  emailDeployment,
  emailPlacement,
  image,
  placement,
  publisher,
  report,
  story,
  template,
  topic,
  user,
  {
    /**
     *
     */
    Date: DateType,
    Cursor: CursorType,
    Mixed: MixedType,
    JSON: GraphQLJSON,

    /**
     *
     */
    Query: {
      /**
       *
       */
      ping: () => 'pong',
    },
  },
);
