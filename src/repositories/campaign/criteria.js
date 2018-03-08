const CampaignRepo = require('./index');

const findCampaign = async (id) => {
  if (!id) throw new Error('Unable to handle criteria: no campaign ID was provided.');
  const campaign = await CampaignRepo.findById(id);
  if (!campaign) throw new Error('Unable to handle criteria: no campaign was found.');
  return campaign;
};

module.exports = {
  /**
   * @param {string} campaignId
   * @param {object} payload
   * @param {date} payload.start
   * @param {date} payload.end
   * @param {array} payload.placementIds
   * @param {array} payload.kvs
   * @return {Promise}
   */
  async setFor(campaignId, {
    start,
    end,
    placementIds,
    kvs,
  } = {}) {
    const campaign = await findCampaign(campaignId);
    campaign.criteria = {
      start,
      end,
      placementIds,
      kvs,
    };
    await campaign.save();
    return campaign.criteria;
  },
};
