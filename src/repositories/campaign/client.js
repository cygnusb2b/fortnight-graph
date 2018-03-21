const Campaign = require('../../models/campaign');

const findCampaign = async (id) => {
  if (!id) throw new Error('Unable to handle submission: no campaign ID was provided.');
  const campaign = await Campaign.findById(id);
  if (!campaign) throw new Error('Unable to handle submission: no campaign was found.');
  return campaign;
};

module.exports = {
  /**
   *
   * @param {string} hash
   * @return {Promise}
   */
  findByHash(hash) {
    if (!hash) return Promise.reject(new Error('Unable to find campaign: no hash was provided.'));
    return Campaign.findOne({ hash });
  },

  /**
   *
   */
  async updateFor(campaignId, { url, creatives } = {}) {
    const campaign = await findCampaign(campaignId);

    campaign.url = url;

    creatives.forEach((item) => {
      const creative = campaign.creatives.id(item.id);
      creative.set('title', item.title);
      creative.set('teaser', item.teaser);
      creative.set('image', item.image);
    });

    return campaign.save();
  },
};
