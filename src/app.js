const express = require('express');
const passport = require('passport');
const cors = require('cors');
const authStrategies = require('./auth-strategies');
const loadRouters = require('./routers');

const app = express();
const CORS = cors();

app.set('trust proxy', 'loopback, linklocal, uniquelocal');
app.disable('x-powered-by');

// Set the auth strategies
passport.use(authStrategies.bearer);

// Initialize passport auth.
app.use(passport.initialize());

app.use(express.static('public', {
  setHeaders: (res, path) => {
    if (path.endsWith('.js')) {
      res.set('Access-Control-Allow-Origin', '*');
      res.set('Timing-Allow-Origin', '*');
      res.set('Status', '200');
    }
    if (path.endsWith('.js.map')) {
      res.set('Access-Control-Allow-Origin', '*');
      res.set('Status', '200');
    }
  },
}));

app.use(CORS);
app.options('*', CORS);

// Redirect root domain requests to the app.
app.get('/', (req, res) => {
  res.redirect(301, '/app');
});

loadRouters(app);

module.exports = app;
