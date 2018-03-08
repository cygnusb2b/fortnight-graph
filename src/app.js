const express = require('express');
const helmet = require('helmet');
const passport = require('passport');
const authStrategies = require('./auth-strategies');
const loadRouters = require('./routers');

const app = express();

// Global middlewares.
app.use(helmet());

// Set the auth strategies
passport.use(authStrategies.bearer);

// Initialize passport auth.
app.use(passport.initialize());

app.use(express.static('public'));

loadRouters(app);

module.exports = app;
