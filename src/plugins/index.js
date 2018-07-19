const imagePlugin = require('./image');
const analyticsPlugin = require('./analytics');
const contactPlugin = require('./notify');
const paginablePlugin = require('./paginable');
const pushId = require('./push-id');
const repositoryPlugin = require('./repository');
const searchablePlugin = require('./searchable');

module.exports = {
  imagePlugin,
  analyticsPlugin,
  contactPlugin,
  paginablePlugin,
  pushId,
  repositoryPlugin,
  searchablePlugin,
};
