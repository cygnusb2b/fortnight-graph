const { Router } = require('express');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const passport = require('passport');
const { graphqlExpress } = require('apollo-server-express');
const Auth = require('../classes/auth');
const schema = require('../graph/schema');
const Advertiser = require('../models/advertiser');
const Campaign = require('../models/campaign');

/**
 * Authenticates a user via the `Authorization: Bearer` JWT.
 * If credentaials are present and valid, will add the `user` and `session`
 * context to `req.auth`.
 *
 * If the request is anonymous (no credentials provided), or the credentials
 * are invalid, an error is _not_ thrown. Instead, the `user` and `session`
 * contexts on `req.auth` are left `undefined` and, additionally, the `err` context is
 * added with the `Error` that was generated. It is possible for the `err` to be `null`,
 * in the case of anonymous users (e.g. `{ user: undefined, session: undefind, err: null }`).
 *
 * Ulitimately, it will be up to the underlying Graph API, and the services
 * it uses, to determine when/if to throw authentication or authorization errors,
 * based on the specific graph action being performed.
 *
 * @param {object} req
 * @param {object} res
 * @param {function} next
 */
const authenticate = (req, res, next) => {
  passport.authenticate('bearer', { session: false }, (err, { user, session } = {}) => {
    req.auth = new Auth({ user, session, err });
    next();
  })(req, res, next);
};

const safeParse = (json) => {
  if (!json) return {};
  try {
    return JSON.parse(json) || {};
  } catch (e) {
    return {};
  }
};

const loadPortal = (req, res, next) => {
  const ctx = safeParse(req.get('x-portal-context'));
  const { advertiser, campaign } = ctx;
  const promises = [];
  const fields = { name: 1, pushId: 1 };

  promises.push(advertiser ? Advertiser.findOne({
    pushId: advertiser,
  }, fields) : Promise.resolve(null));

  promises.push(campaign ? Campaign.findOne({
    pushId: campaign,
  }, fields) : Promise.resolve(null));

  Promise.all(promises).then(([adv, camp]) => {
    req.portal = { advertiser: adv, campaign: camp };
    next();
  }).catch(next);
};

const router = Router();

router.use(
  helmet(),
  authenticate,
  loadPortal,
  bodyParser.json(),
  graphqlExpress((req) => {
    const { auth, portal } = req;
    const context = { auth, portal };
    return { schema, context };
  }),
);

module.exports = router;
