const jwt = require('jsonwebtoken');
const { Router } = require('express');
const noCacheEvents = require('../middleware/no-cache-events');
const Campaign = require('../models/campaign');

const router = Router();
router.use(noCacheEvents());

/**
 * @deprecated
 */
router.get('/:token', (req, res, next) => {
  const { token } = req.params;

  /**
   * NOTE: using `decode` instead of `verify` is intentional.
   * This method of tracking is deprecated, and is only maintained to support URLs
   * that are still in the wild.
   *
   * No analytics events will be tracked: this is also intentional.
   */
  const { payload } = jwt.decode(token, { complete: true });
  const {
    cid,
    url,
  } = payload;

  if (url) {
    // Redirect immediately.
    res.redirect(301, url);
  } else {
    Campaign.strictFindById(cid).then(c => res.redirect(301, c.url)).catch(next);
  }
});

module.exports = router;
