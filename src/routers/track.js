const jwt = require('jsonwebtoken');
const { Router } = require('express');
const { noCache } = require('helmet');
const newrelic = require('../newrelic');
const BotDetector = require('../services/bot-detector');
const AnalyticsLoad = require('../models/analytics/load');
const AnalyticsView = require('../models/analytics/view');
const AnalyticsBot = require('../models/analytics/bot');

const emptyGif = Buffer.from('R0lGODlhAQABAPAAAAAAAAAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==', 'base64');

const router = Router();
router.use(noCache());

const events = ['load', 'view'];
const modelMap = {
  load: AnalyticsLoad,
  view: AnalyticsView,
};

const send = (res, status, err) => {
  if (err) {
    res.set('X-Error-Message', err.message);
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
    const Model = modelMap[event];
    const { cid, hash } = payload;
    const last = new Date();
    const bot = BotDetector.detect(req.get('User-Agent'));
    const doc = bot.detected ? new AnalyticsBot({
      cid,
      hash,
      last,
      value: bot.value,
      e: event,
    }) : new Model({ hash, cid, last });
    return doc.aggregateSave().then(() => send(res, 200)).catch(e => send(res, 500, e));
  });
});

module.exports = router;
