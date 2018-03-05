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
   * @param {array} payload.placements
   * @param {array} payload.kvs
   * @return {Promise}
   */
  async createFor(campaignId, {
    start,
    end,
    placements,
    kvs,
  } = {}) {
    const campaign = await findCampaign(campaignId);
    campaign.criteria = Object.assign({}, {
      start,
      end,
      placements,
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
   * @param {array} payload.placements
   * @param {array} payload.kvs
   * @return {Promise}
   */
  async updateFor(campaignId, {
    start,
    end,
    placements,
    kvs,
  } = {}) {
    const campaign = await findCampaign(campaignId);

    campaign.criteria.start = start;
    campaign.criteria.end = end;
    campaign.criteria.placements = placements;
    campaign.criteria.kvs = kvs;

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
    campaign.criteria = null;
    return campaign.save();
  },
};
