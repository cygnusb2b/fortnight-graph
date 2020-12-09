const { Router } = require('express');
const helmet = require('helmet');
const newrelic = require('../newrelic');
const asyncRoute = require('../utils/async-route');
const { parseOptions } = require('../services/campaign-delivery');
const EmailLineItemDelivery = require('../services/email-line-item-delivery');

const router = Router();
router.use(helmet.noCache());

router.get('/:pid([a-f0-9]{24}).json', asyncRoute(async (req, res) => {
  const { pid } = req.params;
  const { query } = req;
  const { timestamp } = query;
  // timezone offset handling must be handled by the requesting app
  // all delivery is based on UTC time
  let date = new Date();
  const parsed = parseInt(timestamp, 10);
  if (parsed) date = new Date(parsed);

  const data = await EmailLineItemDelivery.findFor({
    placementId: pid,
    date,
    imageOptions: parseOptions(query.imageOptions),
    advertiserLogoOptions: parseOptions(query.advertiserLogoOptions),
  });
  res.json({ data });
}), (err, req, res, next) => { // eslint-disable-line no-unused-vars
  newrelic.noticeError(err);
  const status = err.status || err.statusCode || 500;
  const { message } = err;
  res.status(status).json({ error: { status, message } });
});

module.exports = router;
