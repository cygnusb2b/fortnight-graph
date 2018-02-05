require('dotenv').config();

const pkg = require('../package.json');
const server = require('./server');

const { PORT } = process.env;

server().then((app) => {
  app.listen(PORT);
  process.stdout.write(`Express app '${pkg.name}' listening on port ${PORT}\n`);
});
