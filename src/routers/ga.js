const { Router } = require('express');
const helmet = require('helmet');
const asyncRoute = require('../utils/async-route');
const ga = require('../services/google-analytics');

const router = Router();
router.use(helmet.noCache());

router.get('/:storyId', asyncRoute(async (req, res) => {
  const { storyId } = req.params;
  const opts = { startDate: '2018-08-01', endDate: '2018-08-15' };
  const report = await ga.storyReport(storyId, opts);
  res.json(report);
}));

module.exports = router;
