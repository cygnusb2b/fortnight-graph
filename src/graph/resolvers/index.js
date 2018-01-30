const deepAssign = require('deep-assign');
const { DateType, CursorType } = require('../custom-types');
const ImageRepo = require('../../repositories/image');
const Publisher = require('../../models/publisher');

const advertiser = require('./advertiser');
const campaign = require('./campaign');
const user = require('./user');

module.exports = deepAssign(advertiser, campaign, user, {
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
    signImageUpload: (root, { input }) => {
      const accept = ['image/jpeg', 'image/png', 'image/webm', 'image/gif'];
      const { name, type } = input;
      if (!accept.includes(type)) {
        throw new Error(`The requested file type '${type}' is not supported.`);
      }
      return ImageRepo.signUpload(name);
    },
  },

  /**
   *
   */
  Placement: {
    id: placement => placement.get('pid'),
    publisher: placement => Publisher.findOne({ _id: placement.get('publisherId') }),
  },
});
