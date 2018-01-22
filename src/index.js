const express = require('express');
const helmet = require('helmet');
const bluebird = require('bluebird');
const mongoose = require('mongoose');
const passport = require('passport');
const bearerAuth = require('./auth-strategies/bearer');
const redis = require('./redis');
const pkg = require('../package.json');
const loadRouters = require('./routers');

const app = express();
const port = process.env.PORT || 8100;
const mongoDSN = process.env.MONGO_DSN || 'mongodb://localhost:27017/fortnight';
const redisDSN = process.env.REDIS_DSN || 'redis://localhost:6379/0';

// Initialize DB
mongoose.Promise = bluebird;
mongoose.connect(mongoDSN, {
  ignoreUndefined: true,
  promiseLibrary: bluebird,
}).then(() => process.stdout.write(`Mongoose connected to '${mongoDSN}'\n`));

redis.use('session', { url: redisDSN, prefix: `${pkg.name}:session:` });

// Global middlewares.
app.use(helmet());

// Set the auth strategies
passport.use(bearerAuth);

// Initialize passport auth.
app.use(passport.initialize());

loadRouters(app);

app.listen(port);
process.stdout.write(`Express app '${pkg.name}' listening on port ${port}\n`);
