const jwt = require('jsonwebtoken');
const { Router } = require('express');
const { noCache } = require('helmet');
const BotDetector = require('../services/bot-detector');
const CampaignRepo = require('../repositories/campaign');
const AnalyticsEvent = require('../models/analytics/event');

const router = Router();
router.use(noCache());

router.get('/:token', (req, res, next) => {
  const { token } = req.params;

  jwt.verify(token, process.env.TRACKER_SECRET, { algorithms: 'HS256' }, (err, payload) => {
    if (err) return res.status(403).send(err.message);
    const {
      uuid,
      pid,
      cid,
      url,
    } = payload;
    const ua = req.get('User-Agent');

    const parsed = BotDetector.detect(ua);
    const bot = parsed.detected ? parsed.value : undefined;
    const event = new AnalyticsEvent({
      e: 'click',
      uuid,
      pid,
      cid,
      d: new Date(),
      bot,
      ua,
      ref: req.get('Referer'),
    });

    return event.save().then(() => {
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
