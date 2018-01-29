const createError = require('http-errors');
const Placement = require('../models/placement');
const Campaign = require('../models/campaign');
const Request = require('../models/request');

module.exports = {
  create(payload) {
    const campaign = new Campaign(payload);
    return campaign.save();
  },

  /**
   *
   * @param {string} id
   * @param {string} name
   * @return {Promise}
   */
  update({ id, name, advertiserId }) {
    const criteria = { cid: id };
    const update = { $set : { name } };
    const options = { new: true };
    if (advertiserId) {
      update['$set'].advertiserId = advertiserId;
    }
    return Campaign.findOneAndUpdate(criteria, update, options);
  },
  /**
   *
   * @param {string} cid
   * @return {Promise}
   */
  findById(cid) {
    return Campaign.findOne({ cid });
  },
  /**
   *
   * @param {object} params
   * @param {string} params.pid The placement identifier.
   * @param {string} params.url The URL the ad request came from.
   * @param {number} [params.limit=1] The number of ads to return. Max of 20.
   * @param {object} [params.custom] An object containing custom key/values.
   * @param {object} [params.merge] An object containing custom template merge key/values.
   */
  async findFor({ pid, url, limit = 1 } = {}) {
    if (!pid) throw new Error('No placement ID was provided.');

    /**
     * @todo
     * Do we need to confirm the placement id?
     * If it doesn't exist, the ad algorithm wouldn't return any ads.
     * We do need it for the template, though, but could that be saved along with the schedule?
     * Or the pre-query?
     * We will need the pid for the request.
     */
    const placement = await Placement.findOne({ pid }, { pid: 1, template: 1 });
    if (!placement) throw createError(404, `No placement exists for pid '${pid}'`);

    /**
     * @todo
     * The ad selection algo would now run, find the appropriate ad (or ads), and replace
     * the template's merge variables. Also, replace any custom merge variables. For now, simulate.
     */
    const l = limit > 0 ? parseInt(limit, 10) : 1;
    if (l > 10) throw createError(400, 'You cannot return more than 10 ads in one request.');
    const campaigns = await Campaign.find().limit(l);

    const ads = [];
    const reqs = [];
    /**
     * @todo The request tracking implementation *definitely* needs work.
     * Some sort of pre-aggregation should exist.
     * The campaign id may not always be required (what if no ads were returned?).
     * Merge variables also need to be stored on the request.
     */
    campaigns.forEach((campaign) => {
      const cid = campaign.get('cid');
      const request = new Request({ cid, pid });
      reqs.push(request);

      const correlator = this.createCorrelator(url, request.get('id'));
      const html = placement.template
        .replace(/{{ id }}/g, campaign.get('id'))
        /**
         * @todo This needs to use the campaign creative title, not name.
         */
        .replace(/{{ title }}/g, campaign.get('name'));
      ads.push({ name: campaign.name, html: `${html}\n${correlator}` });
    });
    if (reqs.length) {
      await Request.collection.insertMany(reqs);
    }
    return ads;
  },

  createCorrelator(url, id) {
    return `<img src="${url}/c/l/${id}.gif" data-view-src="${url}/c/v/${id}.gif">`;
  },
};
