const { Router } = require('express');
const { noCache } = require('helmet');
const uuidUtil = require('../utils/uuid');

const emptyGif = Buffer.from('R0lGODlhAQABAPAAAAAAAAAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==', 'base64');
const router = Router();
router.use(noCache());

const events = ['l', 'v'];

router.get('/:event/:uuid.gif', (req, res) => {
  res.set('Content-Type', 'image/gif');
  const { event, uuid } = req.params;
  const id = uuidUtil.normalize(uuid);

  if (events.includes(event) && uuidUtil.is(id)) {
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
