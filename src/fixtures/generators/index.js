const publisher = require('./publisher');
const placement = require('./placement');
const advertiser = require('./advertiser');
const campaign = require('./campaign');
const creative = require('./campaign/creative');
const criteria = require('./campaign/criteria');
const user = require('./user');
const template = require('./template');

module.exports = {
  publisher,
  placement,
  advertiser,
  campaign,
  creative,
  criteria,
  user,
  template,
};
