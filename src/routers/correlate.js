const { Router } = require('express');
const { noCache } = require('helmet');

const regex = new RegExp('[a-f0-9]{32}');
const emptyGif = Buffer.from('R0lGODlhAQABAPAAAAAAAAAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==', 'base64');
const router = Router();
router.use(noCache());

const events = ['l', 'v'];

router.get('/:event/:uuid.gif', (req, res) => {
  res.set('Content-Type', 'image/gif');
  // res.set('Connection', 'close');
  const { event, uuid } = req.params;
  const id = uuid.replace(/-/g, '');

  if (events.includes(event) && regex.test(id)) {
    res.status(200);
    /**
     * @todo
     * Save the event, "post-process."
     * Also, determine if the correlator must already exist in the db.
     * Also, determine if we need to add throttling, and/or bot detection?
     */
  } else {
    res.status(400);
  }
  res.send(emptyGif);
});

module.exports = router;
