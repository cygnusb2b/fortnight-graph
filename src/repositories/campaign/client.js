const CreativeRepo = require('./creative');
const Campaign = require('../../models/campaign');

module.exports = {
  /**
   *
   * @param {string} cid
   * @param {object} payload
   * @param {string} payload.name
   * @param {string} payload.advertiserId
   * @return {Promise}
   */
  async updateFor(id, { url, creatives } = {}) {
    if (!id) return Promise.reject(new Error('Unable to update campaign: no ID was provided.'));
    const criteria = { _id: id };
    const update = { $set: { url } };
    const options = { new: true, runValidators: true };
    const campaign = await Campaign.findOneAndUpdate(criteria, update, options).then((document) => {
      if (!document) throw new Error(`Unable to update campaign: no record was found for ID '${id}'`);
      return document;
    });
    creatives.forEach((creative) => {
      const creativeId = creative.id;
      CreativeRepo.updateFor(id, creativeId, creative).then((document) => {
        if (!document) throw new Error(`Unable to update campaign creative: no record was found for ID '${id}'`);
        return document;
      });
    });
    return campaign;
  },
};
