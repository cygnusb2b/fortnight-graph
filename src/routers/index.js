const graph = require('./graph');

module.exports = (app) => {
  app.use('/graph', graph);
};
