const ga = require('./ga');
const graph = require('./graph');
const placement = require('./placement');
const event = require('./event');
const upload = require('./upload');

module.exports = (app) => {
  app.use('/ga', ga);
  app.use('/graph', graph);
  app.use('/placement', placement);
  app.use('/e', event);
  app.use('/upload', upload);
};
