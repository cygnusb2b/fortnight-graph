const graph = require('./graph');
const placement = require('./placement');
const event = require('./event');
const redir = require('./redir');
const go = require('./go');
const goto = require('./go-to');

module.exports = (app) => {
  app.use('/graph', graph);
  app.use('/placement', placement);
  app.use('/e', event);
  app.use('/redir', redir);
  app.use('/go', go);
  app.use('/go-to', goto);
};
