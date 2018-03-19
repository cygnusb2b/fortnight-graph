const graph = require('./graph');
const placement = require('./placement');
const track = require('./track');
const redir = require('./redir');
const go = require('./go');

module.exports = (app) => {
  app.use('/graph', graph);
  app.use('/placement', placement);
  app.use('/t', track);
  app.use('/redir', redir);
  app.use('/go', go);
};
