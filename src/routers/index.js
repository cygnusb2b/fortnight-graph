const graph = require('./graph');
const placement = require('./placement');
const correlate = require('./correlate');

module.exports = (app) => {
  app.use('/graph', graph);
  app.use('/placement', placement);
  app.use('/c', correlate);
};
