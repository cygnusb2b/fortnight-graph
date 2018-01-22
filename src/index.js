const express = require('express');
const helmet = require('helmet');
const bluebird = require('bluebird');
const mongoose = require('mongoose');
const pkg = require('../package.json');
const loadRouters = require('./routers');

const app = express();
const port = process.env.PORT || 8100;
const dsn = process.env.MONGO_DSN || 'mongodb://localhost:27017/fortnight';

// Initialize DB
mongoose.Promise = bluebird;
mongoose.connect(dsn, {
  ignoreUndefined: true,
  promiseLibrary: bluebird,
}).then(() => process.stdout.write(`Mongoose connected to '${dsn}'\n`));

// Global middlewares.
app.use(helmet());

loadRouters(app);

app.listen(port);
process.stdout.write(`Express app '${pkg.name}' listening on port ${port}\n`);
