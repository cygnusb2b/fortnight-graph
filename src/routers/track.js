const jwt = require('jsonwebtoken');
const { Router } = require('express');
const { noCache } = require('helmet');
const AnalyticsLoad = require('../models/analytics/load');
const AnalyticsView = require('../models/analytics/view');
const AnalyticsLog = require('../models/analytics/event-log');

const emptyGif = Buffer.from('R0lGODlhAQABAPAAAAAAAAAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==', 'base64');

const router = Router();
router.use(noCache());

const events = ['load', 'view'];
const modelMap = {
  load: AnalyticsLoad,
  view: AnalyticsView,
};

const send = (res, status, message) => {
  if (message) res.set('X-Error-Message', message);
  res.status(status);
  res.send(emptyGif);
};

router.get('/:token/:event.gif', (req, res) => {
  res.set('Content-Type', 'image/gif');
  const { token, event } = req.params;

  if (!events.includes(event)) {
    return send(res, 400, `The event type '${event}' is invalid.`);
  }
  return jwt.verify(token, process.env.TRACKER_SECRET, { algorithms: 'HS256' }, (err, payload) => {
    if (err) return send(res, 403, err.message);
    const Model = modelMap[event];
    const { cid, hash } = payload;
    const last = new Date();
    const ua = req.get('user-agent');
    const log = new AnalyticsLog({ hash, event, ua });
    return log.save().then(() => {
      const doc = new Model({ hash, cid, last });
      return doc.aggregateSave().then(() => send(res, 200)).catch(e => send(res, 500, e.message));
    });
  });
});

module.exports = router;
