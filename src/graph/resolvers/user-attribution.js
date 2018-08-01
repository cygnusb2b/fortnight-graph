const User = require('../../models/user');

module.exports = {
  createdBy: doc => User.findById(doc.createdById),
  updatedBy: doc => User.findById(doc.updatedById),
};
