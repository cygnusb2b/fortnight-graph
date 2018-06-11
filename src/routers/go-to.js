const { Router } = require('express');
const CampaignRepo = require('../repositories/campaign');

const router = Router();
const { APP_BASE_URL } = process.env;
const handleAsync = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

/**
 *
 */
router.get('/campaign/:id', handleAsync(async (req, res) => {
  const { id } = req.params;
  res.redirect(301, `${APP_BASE_URL}/app/manage/campaign/${id}`);
}));

/**
 *
 */
router.get('/collect/:campaignHash', handleAsync(async (req, res) => {
  const { campaignHash } = req.params;
  const campaign = await CampaignRepo.findByHash(campaignHash);
  const { advertiserId } = campaign;
  res.redirect(301, `${APP_BASE_URL}/app/portal/${advertiserId}/campaigns/${campaignHash}/material-collect`);
}));

/**
 *
 */
router.get('/report-summary/:campaignHash', handleAsync(async (req, res) => {
  const { campaignHash } = req.params;
  const campaign = await CampaignRepo.findByHash(campaignHash);
  const { advertiserId } = campaign;
  res.redirect(301, `${APP_BASE_URL}/app/portal/${advertiserId}/campaigns/${campaignHash}/reports/summary`);
}));

/**
 *
 */
router.get('/report-creative-breakdown/:campaignHash', handleAsync(async (req, res) => {
  const { campaignHash } = req.params;
  const campaign = await CampaignRepo.findByHash(campaignHash);
  const { advertiserId } = campaign;
  res.redirect(301, `${APP_BASE_URL}/app/portal/${advertiserId}/campaigns/${campaignHash}/reports/creative-breakdown`);
}));

module.exports = router;
