const jwt = require('jsonwebtoken');
const { Router } = require('express');
const { noCache } = require('helmet');

const emptyGif = Buffer.from('R0lGODlhAQABAPAAAAAAAAAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==', 'base64');
const router = Router();
router.use(noCache());

const events = ['load', 'view'];

router.get('/:token/:event.gif', (req, res) => {
  res.set('Content-Type', 'image/gif');
  const { token, event } = req.params;

  if (events.includes(event)) {
    jwt.verify(token, process.env.TRACKER_SECRET, { algorithms: 'HS256' }, (err) => {
      if (err) {
        res.status(403);
      } else {
        // @todo Save the event.
        res.status(200);
      }
    });
  } else {
    res.status(400);
  }
  res.send(emptyGif);
});

module.exports = router;
