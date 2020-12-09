const graph = require('./graph');
const emailPlacement = require('./email-placement');
const placement = require('./placement');
const event = require('./event');
const upload = require('./upload');

module.exports = (app) => {
  app.use('/graph', graph);
  app.use('/email-placement', emailPlacement);
  app.use('/placement', placement);
  app.use('/e', event);
  app.use('/upload', upload);
};
