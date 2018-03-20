const jwt = require('jsonwebtoken');
const { Router } = require('express');
const { noCache } = require('helmet');
const newrelic = require('../newrelic');
const BotDetector = require('../services/bot-detector');
const AnalyticsEvent = require('../models/analytics/event');

const emptyGif = Buffer.from('R0lGODlhAQABAPAAAAAAAAAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==', 'base64');

const router = Router();
router.use(noCache());

const events = ['load', 'view'];

const send = (res, status, err) => {
  if (err) {
    newrelic.noticeError(err);
  }
  res.status(status);
  res.send(emptyGif);
};

router.get('/:token/:event.gif', (req, res) => {
  res.set('Content-Type', 'image/gif');
  const { token, event } = req.params;

  if (!events.includes(event)) {
    return send(res, 400, new Error(`The event type '${event}' is invalid.`));
  }
  return jwt.verify(token, process.env.TRACKER_SECRET, { algorithms: 'HS256' }, (err, payload) => {
    if (err) return send(res, 403, err);
    const { uuid, pid, cid } = payload;

    const ua = req.get('User-Agent');
    const bot = BotDetector.detect(ua);
    const doc = new AnalyticsEvent({
      e: event,
      uuid,
      pid,
      cid,
      d: new Date(),
      bot,
      ua,
      ref: req.get('Referer'),
    });

    return doc.save().then(() => send(res, 200)).catch(e => send(res, 500, e));
  });
});

module.exports = router;
