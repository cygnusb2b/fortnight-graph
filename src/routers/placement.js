const { Router } = require('express');
const querystring = require('querystring');
const createError = require('http-errors');
const AdRepo = require('../repositories/ad');

const router = Router();

const acceptable = ['json', 'html'];

const handleError = (err, req, res) => {
  const { ext } = req.params;
  const extension = acceptable.includes(ext) ? ext : 'html';
  const status = err.status || err.statusCode || 500;
  const message = err.expose ? err.message : 'A fatal error has occurred.';

  let response = `${message} (${status})`;
  if (extension === 'json') {
    response = { error: { status, message } };
  }
  res.status(status).send(response);
};

const parseVariables = (vars = {}) => {
  let variables = {};
  if (typeof vars === 'string') {
    const parsed = querystring.parse(vars);
    if (parsed && typeof parsed === 'object') variables = parsed;
  } else if (vars && typeof vars === 'object') {
    variables = vars;
  }
  return variables;
};

router.get('/:pid.:ext', (req, res) => {
  const { pid, ext } = req.params;
  const { limit, cv, mv } = req.query;

  if (acceptable.includes(ext)) {
    const custom = parseVariables(cv);
    const merge = parseVariables(mv);
    AdRepo.findFor({
      pid,
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
