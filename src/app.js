const express = require('express');
const passport = require('passport');
const cors = require('cors');
const authStrategies = require('./auth-strategies');
const loadRouters = require('./routers');
const { TRUSTED_PROXIES } = require('./env');

const app = express();
const CORS = cors();

const proxies = ['loopback', 'linklocal', 'uniquelocal'];
if (TRUSTED_PROXIES) {
  TRUSTED_PROXIES.split(',').map(p => p.trim()).filter(p => p).forEach(p => proxies.push(p));
}
app.set('trust proxy', proxies);
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
