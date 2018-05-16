const models = require('../models');

const { keys } = Object;

module.exports = keys(models)
  .map(k => models[k])
  .filter(Model => Model.schema.options.es_enabled === true);
