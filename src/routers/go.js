const { Router } = require('express');
const { noCache } = require('helmet');

const router = Router();
router.use(noCache());

/**
 * @deprecated
 * This router only exists to maintain URLs that are in the wild.
 * This simply redirects to the `redir` route (also deprecated) to
 * handle the logic.
 *
 * @todo Eventually turn this into a 410 response.
 */
router.get('/:token', (req, res) => {
  const { token } = req.params;
  const url = `${req.protocol}://${req.get('host')}/redir/${token}`;
  res.redirect(301, url);
});

module.exports = router;
