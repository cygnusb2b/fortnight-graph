const graph = require('./graph');
const placement = require('./placement');
const track = require('./track');

module.exports = (app) => {
  app.use('/graph', graph);
  app.use('/placement', placement);
  app.use('/t', track);
};
