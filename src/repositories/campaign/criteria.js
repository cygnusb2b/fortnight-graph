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
  async createFor(campaignId, {
    start,
    end,
    placementIds,
    kvs,
  } = {}) {
    const campaign = await findCampaign(campaignId);
    campaign.criteria = Object.assign({}, {
      start,
      end,
      placementIds,
      kvs,
    });
    await campaign.save();
    return campaign.criteria;
  },

  /**
   * @param {string} campaignId
   * @param {object} payload
   * @param {date} payload.start
   * @param {date} payload.end
   * @param {array} payload.placementIds
   * @param {array} payload.kvs
   * @return {Promise}
   */
  async updateFor(campaignId, {
    start,
    end,
    placementIds,
    kvs,
  } = {}) {
    const campaign = await findCampaign(campaignId);

    const { criteria } = campaign;
    criteria.start = start;
    criteria.end = end;
    criteria.placementIds = placementIds;
    criteria.kvs = kvs;

    await campaign.save();
    return campaign.criteria;
  },

  /**
   * @param {string} campaignId
   * @param {string} criteriaId
   * @return {Promise}
   */
  async removeFrom(campaignId) {
    const campaign = await findCampaign(campaignId);
    campaign.criteria.remove();
    return campaign.save();
  },
};
