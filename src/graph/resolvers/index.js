const deepAssign = require('deep-assign');
const { DateType, CursorType } = require('../custom-types');
const ImageRepo = require('../../repositories/image');
const AutocompleteRepo = require('../../repositories/autocomplete');

const advertiser = require('./advertiser');
const campaign = require('./campaign');
const user = require('./user');
const template = require('./template');
const publisher = require('./publisher');
const placement = require('./placement');

module.exports = deepAssign(advertiser, campaign, user, template, publisher, placement, {
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

    /**
     *
     */
    autocomplete: (root, { input }) => {
      const { type, field, term } = input;
      return AutocompleteRepo.autocomplete(type, field, term);
    },
  },
});
