const { Router } = require('express');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const passport = require('passport');
const { graphqlExpress } = require('apollo-server-express');
const Auth = require('../classes/auth');
const Portal = require('../classes/portal');
const schema = require('../graph/schema');
const Advertiser = require('../models/advertiser');
const Campaign = require('../models/campaign');
const asyncRoute = require('../utils/async-route');

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
    const { portal } = req;
    req.auth = new Auth({
      user,
      session,
      portal,
      err,
    });
    next();
  })(req, res, next);
};

const loadPortal = asyncRoute(async (req, res, next) => {
  const pushId = req.get('x-portal-hash');

  let id;
  let hash;
  const campaigns = [];

  if (pushId) {
    const adv = await Advertiser.findOne({ pushId }, { pushId: 1 });
    if (adv) {
      id = adv.id.toString();
      hash = adv.pushId;
      const camps = await Campaign.find({ advertiserId: adv.id }, { pushId: 1 });
      camps.forEach(camp => campaigns.push({ id: camp.id.toString(), hash: camp.pushId }));
    }
  }
  req.portal = new Portal({ id, hash, campaigns });
  next();
});

const router = Router();

router.use(
  helmet(),
  loadPortal,
  authenticate,
  bodyParser.json(),
  graphqlExpress((req) => {
    const { auth, portal, ip } = req;
    const context = { auth, portal, ip };
    return { schema, context };
  }),
);

module.exports = router;
