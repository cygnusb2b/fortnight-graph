const Campaign = require('../models/campaign');

module.exports = {
  /**
   * @param {string} campaignId
   * @param {object} payload
   * @param {string} payload.title
   * @return {Promise}
   */
  async createFor(campaignId, {
    title,
    teaser,
    imageId,
    active,
  } = {}) {
    const campaign = await Campaign.strictFindActiveById(campaignId);
    const { creatives } = campaign;
    creatives.push({
      title,
      teaser,
      imageId,
      active,
    });

    await campaign.save();
    return creatives[creatives.length - 1];
  },

  /**
   * @param {string} campaignId
   * @param {object} payload
   * @param {string} payload.title
   * @return {Promise}
   */
  async updateDetailsFor(campaignId, creativeId, { title, teaser, active } = {}) {
    const campaign = await Campaign.strictFindActiveById(campaignId);
    const creative = campaign.creatives.id(creativeId);
    if (!creative) throw new Error('Unable to handle creative: no creative was found for the provided ID.');
    creative.set({
      title,
      teaser,
      active,
    });

    await campaign.save();
    return campaign.creatives.id(creativeId);
  },

  /**
   * @param {string} campaignId
   * @param {string} creativeId
   * @param {string} imageId
   */
  async updateImageFor(campaignId, creativeId, imageId) {
    const campaign = await Campaign.strictFindActiveById(campaignId);
    const creative = campaign.creatives.id(creativeId);
    if (!creative) throw new Error('Unable to handle creative: no creative was found for the provided ID.');

    creative.imageId = imageId;
    await campaign.save();
    return campaign.creatives.id(creativeId);
  },

  /**
   *
   * @param {string} campaignId
   * @param {string} creativeId
   * @param {boolean} active
   */
  async setStatusFor(campaignId, creativeId, active) {
    const campaign = await Campaign.strictFindActiveById(campaignId);
    const creative = campaign.creatives.id(creativeId);
    if (!creative) throw new Error('Unable to handle creative: no creative was found for the provided ID.');

    creative.active = active;
    await campaign.save();
    return campaign.creatives.id(creativeId);
  },

  /**
   *
   * @param {string} campaignId
   * @param {string} creativeId
   */
  async findFor(campaignId, creativeId) {
    const campaign = await Campaign.strictFindActiveById(campaignId);
    const creative = campaign.creatives.id(creativeId);
    if (!creative || creative.deleted) throw new Error('No creative was found for the provided ID.');
    return creative;
  },

  /**
   * @param {string} campaignId
   * @param {string} creativeId
   * @return {Promise}
   */
  async removeFrom(campaignId, creativeId) {
    if (!creativeId) throw new Error('Unable to handle creative: no creative ID was provided.');
    const campaign = await Campaign.strictFindActiveById(campaignId);

    const creative = campaign.creatives.id(creativeId);
    if (!creative) throw new Error('Unable to handle creative: no creative was found for the provided ID.');
    creative.deleted = true;
    return campaign.save();
  },
};
