const graph = require('./graph');
const placement = require('./placement');
const track = require('./track');
const go = require('./go');

module.exports = (app) => {
  app.use('/graph', graph);
  app.use('/placement', placement);
  app.use('/t', track);
  app.use('/go', go);
};
