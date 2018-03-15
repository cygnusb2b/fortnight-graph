const jwt = require('jsonwebtoken');
const { Router } = require('express');
const { noCache } = require('helmet');
const BotDetector = require('../services/bot-detector');
const CampaignRepo = require('../repositories/campaign');
const AnalyticsClick = require('../models/analytics/click');
const AnalyticsBot = require('../models/analytics/bot');

const router = Router();
router.use(noCache());

router.get('/:token', (req, res, next) => {
  const { token } = req.params;

  jwt.verify(token, process.env.TRACKER_SECRET, { algorithms: 'HS256' }, (err, payload) => {
    if (err) return res.status(403).send(err.message);
    const { cid, hash, url } = payload;
    const last = new Date();

    const bot = BotDetector.detect(req.get('User-Agent'));
    const model = bot.detected ? new AnalyticsBot({
      cid,
      hash,
      last,
      value: bot.value,
      e: 'click',
    }) : new AnalyticsClick({ cid, hash, last });

    return model.aggregateSave().then(() => {
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
