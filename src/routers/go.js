const jwt = require('jsonwebtoken');
const { Router } = require('express');
const { noCache } = require('helmet');
const CampaignRepo = require('../repositories/campaign');
const AnalyticsClick = require('../models/analytics/click');

const router = Router();
router.use(noCache());

router.get('/:token', (req, res, next) => {
  const { token } = req.params;

  jwt.verify(token, process.env.TRACKER_SECRET, { algorithms: 'HS256' }, (err, payload) => {
    if (err) return res.status(403).send(err.message);
    const { cid, hash, url } = payload;
    const last = new Date();
    const click = new AnalyticsClick({ cid, hash, last });

    return click.aggregateSave().then(() => {
      if (url) {
        // Redirect immediately.
        res.redirect(301, url);
      } else {
        // Find campaign's URL and redirect.
        CampaignRepo.findById(cid).then(c => res.redirect(301, c.url)).catch(next);
      }
    }).catch(next);
  });
});

module.exports = router;
