const { Router } = require('express');
const noCacheEvents = require('../middleware/no-cache-events');
const newrelic = require('../newrelic');
const EventHandler = require('../services/event-handler');

const emptyGif = Buffer.from('R0lGODlhAQABAPAAAAAAAAAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==', 'base64');

const router = Router();
router.use(noCacheEvents());

const send = (res, status, err) => {
  if (err) {
    newrelic.noticeError(err);
  }
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Content-Type', 'image/gif');

  res.status(status);
  res.send(emptyGif);
};

const trackEvent = (req, res) => {
  const { action } = req.params;
  // Track the event, but don't await so the response is fast.
  EventHandler.track({
    action,
    fields: req.query,
    ua: req.get('User-Agent'),
    ip: req.ip,
    ref: req.get('Referer'),
  }).catch(newrelic.noticeError.bind(newrelic));
  send(res, 200);
};

router.get('/:action.gif', trackEvent);
router.post('/:action.gif', trackEvent);

module.exports = router;
