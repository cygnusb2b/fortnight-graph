const deepAssign = require('deep-assign');
const { DateType, CursorType } = require('@limit0/graphql-custom-types');
const GraphQLJSON = require('graphql-type-json');
const MixedType = require('../types/mixed');

const advertiser = require('./advertiser');
const campaign = require('./campaign');
const contact = require('./contact');
const image = require('./image');
const placement = require('./placement');
const publisher = require('./publisher');
const report = require('./report');
const story = require('./story');
const template = require('./template');
const user = require('./user');

module.exports = deepAssign(
  advertiser,
  campaign,
  contact,
  image,
  placement,
  publisher,
  report,
  story,
  template,
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
