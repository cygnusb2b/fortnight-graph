const deepAssign = require('deep-assign');
const { DateType, CursorType } = require('../custom-types');
const ImageRepo = require('../../repositories/image');
const PublisherRepo = require('../../repositories/publisher');

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
      const { name, type } = input;
      return ImageRepo.signUpload(name, type);
    },
  },

  /**
   *
   */
  Placement: {
    publisher: placement => PublisherRepo.findById(placement.get('publisherId')),
  },
});
