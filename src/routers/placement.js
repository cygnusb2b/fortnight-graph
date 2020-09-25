const { Router } = require('express');
const helmet = require('helmet');
const createError = require('http-errors');
const newrelic = require('../newrelic');
const env = require('../env');
const CampaignDelivery = require('../services/campaign-delivery');

const router = Router();
router.use(helmet.noCache());

const acceptable = ['json', 'html'];

const handleError = (err, req, res) => {
  newrelic.noticeError(err);
  const { ext } = req.params;
  const extension = acceptable.includes(ext) ? ext : 'html';
  const status = err.status || err.statusCode || 500;
  const message = err.expose ? err.message : 'A fatal error has occurred.';
  res.set('Content-Type', 'text/html');
  let response = `<!-- ${message} (${status}) -->`;
  if (extension === 'json') {
    response = { error: { status, message } };
    res.set('Content-Type', 'application/json');
  }
  res.status(status).send(response);
};

const handleJsonError = (err, req, res) => {
  const status = err.status || err.statusCode || 500;
  const { message } = err;
  res.status(status).json({ error: { status, message } });
};

router.get('/elements/:pid.json', (req, res) => {
  const { pid } = req.params;
  const {
    n,
    cv,
    image,
    flags,
  } = CampaignDelivery.parseOptions(req.query.opts);
  const vars = { custom: cv, image, flags };

  const { NODE_ENV } = env;
  const protocol = NODE_ENV === 'production' ? 'https' : req.protocol;

  CampaignDelivery.elementsFor({
    userAgent: req.get('User-Agent'),
    ipAddress: req.ip,
    requestURL: `${protocol}://${req.get('host')}`,
    placementId: pid,
    num: n,
    vars,
  }).then((ads) => {
    res.json({ ads });
  }).catch(err => handleJsonError(err, req, res));
});

router.get('/:pid.:ext', (req, res) => {
  const { pid, ext } = req.params;
  if (acceptable.includes(ext)) {
    const {
      n,
      cv,
      mv,
      fv,
    } = CampaignDelivery.parseOptions(req.query.opts);

    const vars = { custom: cv, merge: mv, fallback: fv };
    const { NODE_ENV } = env;
    const protocol = NODE_ENV === 'production' ? 'https' : req.protocol;
    CampaignDelivery.findFor({
      userAgent: req.get('User-Agent'),
      ipAddress: req.ip,
      requestURL: `${protocol}://${req.get('host')}`,
      placementId: pid,
      num: n,
      vars,
    }).then((ads) => {
      if (ext === 'html') {
        const html = ads.reduce((str, ad) => `${str}\n${ad.html}`, '');
        res.send(html);
      } else {
        res.json(ads);
      }
    }).catch(err => handleError(err, req, res));
  } else {
    const err = createError(400, 'The requested file extension is not supported.');
    handleError(err, req, res);
  }
});

module.exports = router;
