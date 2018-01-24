require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const bluebird = require('bluebird');
const mongoose = require('mongoose');
const passport = require('passport');
const authStrategies = require('./auth-strategies');
const redis = require('./redis');
const pkg = require('../package.json');
const loadRouters = require('./routers');

const app = express();
const { PORT, MONGO_DSN, REDIS_DSN } = process.env;

// Initialize DB
mongoose.Promise = bluebird;
mongoose.connect(MONGO_DSN, {
  // autoIndex: process.env.NODE_ENV !== 'production',
  ignoreUndefined: true,
  promiseLibrary: bluebird,
}).then(() => process.stdout.write(`Mongoose connected to '${MONGO_DSN}'\n`));

redis.use('session', { url: REDIS_DSN, prefix: `${pkg.name}:session:` });

// Global middlewares.
app.use(helmet());

// Set the auth strategies
passport.use(authStrategies.bearer);

// Initialize passport auth.
app.use(passport.initialize());

loadRouters(app);

app.listen(PORT);
process.stdout.write(`Express app '${pkg.name}' listening on port ${PORT}\n`);
