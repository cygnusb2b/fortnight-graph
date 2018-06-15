const CampaignRepo = require('./index');

const findCampaign = async (id) => {
  if (!id) throw new Error('Unable to handle creative: no campaign ID was provided.');
  const campaign = await CampaignRepo.findById(id);
  if (!campaign) throw new Error('Unable to handle creative: no campaign was found.');
  return campaign;
};

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
    status,
  } = {}) {
    const campaign = await findCampaign(campaignId);
    const { creatives } = campaign;
    creatives.push({
      title,
      teaser,
      imageId,
      status,
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
  async updateFor(campaignId, creativeId, {
    title,
    teaser,
    image,
    status,
  } = {}) {
    const campaign = await findCampaign(campaignId);
    const creative = campaign.creatives.id(creativeId);
    if (!creative) throw new Error('Unable to handle creative: no creative was found for the provided ID.');
    creative.set({
      title,
      teaser,
      image,
      status,
    });

    await campaign.save();
    return campaign.creatives.id(creativeId);
  },

  /**
   * @param {string} campaignId
   * @param {object} payload
   * @param {string} payload.title
   * @return {Promise}
   */
  async updateDetailsFor(campaignId, creativeId, { title, teaser, status } = {}) {
    const campaign = await findCampaign(campaignId);
    const creative = campaign.creatives.id(creativeId);
    if (!creative) throw new Error('Unable to handle creative: no creative was found for the provided ID.');
    creative.set({
      title,
      teaser,
      status,
    });

    await campaign.save();
    return campaign.creatives.id(creativeId);
  },

  /**
   * @param {string} campaignId
   * @param {string} creativeId
   * @param {object} payload
   */
  async updateImageFor(campaignId, creativeId, {
    filePath,
    mimeType,
    fileSize,
    width,
    height,
    focalPoint,
  } = {}) {
    const campaign = await findCampaign(campaignId);
    const creative = campaign.creatives.id(creativeId);
    if (!creative) throw new Error('Unable to handle creative: no creative was found for the provided ID.');

    creative.set('image', {
      filePath,
      mimeType,
      fileSize,
      width,
      height,
      focalPoint,
    });

    await campaign.save();
    return campaign.creatives.id(creativeId);
  },

  /**
   *
   * @param {string} campaignId
   * @param {string} creativeId
   * @param {string} status
   */
  async setStatusFor(campaignId, creativeId, status) {
    const campaign = await findCampaign(campaignId);
    const creative = campaign.creatives.id(creativeId);
    if (!creative) throw new Error('Unable to handle creative: no creative was found for the provided ID.');

    creative.status = status;
    await campaign.save();
    return campaign.creatives.id(creativeId);
  },

  /**
   *
   * @param {string} campaignId
   * @param {string} creativeId
   */
  async findFor(campaignId, creativeId) {
    const campaign = await findCampaign(campaignId);
    const creative = campaign.creatives.id(creativeId);
    if (!creative) throw new Error('No creative was found for the provided ID.');
    return creative;
  },

  /**
   * @param {string} campaignId
   * @param {string} creativeId
   * @return {Promise}
   */
  async removeFrom(campaignId, creativeId) {
    if (!creativeId) throw new Error('Unable to handle creative: no creative ID was provided.');
    const campaign = await findCampaign(campaignId);

    const creative = campaign.creatives.id(creativeId);
    if (!creative) throw new Error('Unable to handle creative: no creative was found for the provided ID.');
    creative.remove();
    return campaign.save();
  },
};
