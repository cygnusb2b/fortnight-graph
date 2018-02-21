const { Router } = require('express');
const createError = require('http-errors');
const CampaignPlacementRepo = require('../repositories/campaign/placement');

const router = Router();

const acceptable = ['json', 'html'];

const handleError = (err, req, res) => {
  const { ext } = req.params;
  const extension = acceptable.includes(ext) ? ext : 'html';
  const status = err.status || err.statusCode || 500;
  const message = err.expose ? err.message : 'A fatal error has occurred.';
  res.set('Content-Type', 'text/html');
  let response = `${message} (${status})`;
  if (extension === 'json') {
    response = { error: { status, message } };
    res.set('Content-Type', 'application/json');
  }
  res.status(status).send(response);
};

router.get('/:pid.:ext', (req, res) => {
  const url = `${req.protocol}://${req.get('host')}`;
  const { pid, ext } = req.params;
  const {
    limit,
    cv,
    mv,
    tid,
  } = req.query;

  if (acceptable.includes(ext)) {
    const custom = CampaignPlacementRepo.parseVariables(cv);
    const merge = CampaignPlacementRepo.parseVariables(mv);
    CampaignPlacementRepo.findFor({
      url,
      pid,
      tid,
      limit,
      custom,
      merge,
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
