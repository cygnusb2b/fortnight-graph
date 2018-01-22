const express = require('express');
const helmet = require('helmet');
const pkg = require('../package.json');

const app = express();
const port = process.env.PORT || 8100;

// Global middlewares.
app.use(helmet());

app.get('/ping', (req, res) => {
  res.json({ pong: true });
});

app.listen(port);
process.stdout.write(`${pkg.name} graph listening on port ${port}\n`);
