const { Router } = require('express');
const helmet = require('helmet');
const createError = require('http-errors');
const CampaignPlacementRepo = require('../repositories/campaign/placement');

const router = Router();
router.use(helmet.noCache());

const acceptable = ['json', 'html'];

const handleError = (err, req, res) => {
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

router.get('/:pid.:ext', (req, res) => {
  const { pid, ext } = req.params;
  if (acceptable.includes(ext)) {
    const {
      tid,
      n,
      cv,
      mv,
      fv,
    } = CampaignPlacementRepo.parseOptions(req.query.opts);

    const vars = { custom: cv, merge: mv, fallback: fv };
    CampaignPlacementRepo.findFor({
      requestURL: `${req.protocol}://${req.get('host')}`,
      placementId: pid,
      templateId: tid,
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
