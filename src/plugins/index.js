const analyticsPlugin = require('./analytics');
const deleteablePlugin = require('./deleteable');
const imagePlugin = require('./image');
const notifyPlugin = require('./notify');
const paginablePlugin = require('./paginable');
const pushIdPlugin = require('./push-id');
const referencePlugin = require('./reference');
const repositoryPlugin = require('./repository');
const reservePctPlugin = require('./reserve-pct');
const searchablePlugin = require('./searchable');
const userAttributionPlugin = require('./user-attribution');

module.exports = {
  analyticsPlugin,
  deleteablePlugin,
  imagePlugin,
  notifyPlugin,
  paginablePlugin,
  pushIdPlugin,
  referencePlugin,
  repositoryPlugin,
  reservePctPlugin,
  searchablePlugin,
  userAttributionPlugin,
};
