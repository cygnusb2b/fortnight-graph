const express = require('express');
const passport = require('passport');
const authStrategies = require('./auth-strategies');
const loadRouters = require('./routers');

const app = express();
app.set('trust proxy', 'loopback, linklocal, uniquelocal');
app.disable('x-powered-by');

// Set the auth strategies
passport.use(authStrategies.bearer);

// Initialize passport auth.
app.use(passport.initialize());

app.use(express.static('public'));

loadRouters(app);

module.exports = app;
