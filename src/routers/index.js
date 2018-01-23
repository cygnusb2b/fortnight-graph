const graph = require('./graph');
const placement = require('./placement');

module.exports = (app) => {
  app.use('/graph', graph);
  app.use('/placement', placement);
};
