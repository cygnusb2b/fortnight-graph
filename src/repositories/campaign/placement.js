const createError = require('http-errors');
const Placement = require('../../models/placement');
const Template = require('../../models/template');
const Campaign = require('../../models/campaign');
const Request = require('../../models/request');

module.exports = {
  parseOptions(options) {
    if (!options) return {};
    try {
      return JSON.parse(String(options));
    } catch (e) {
      return {};
    }
  },

  /**
   *
   * @param {object} params
   * @param {string} params.placementId The placement identifier.
   * @param {string} params.templateId The template identifier.
   * @param {string} params.requestURL The URL the ad request came from.
   * @param {number} [params.num=1] The number of ads to return. Max of 20.
   * @param {object} [params.vars] An object containing targeting, merge, and fallback vars.
   */
  async findFor({
    placementId,
    templateId,
    requestURL,
    num = 1,
  } = {}) {
    if (!requestURL) throw new Error('No request URL was provided');
    if (!placementId) throw createError(400, 'No placement ID was provided.');
    if (!templateId) throw createError(400, 'No template ID was provided.');

    const limit = num > 0 ? parseInt(num, 10) : 1;
    if (limit > 10) throw createError(400, 'You cannot return more than 10 ads in one request.');

    /**
     * @todo
     * Determine what _actually_ needs to be queried here.
     * Keep this as small (and as fast) as possible.
     */
    const placement = await Placement.findOne({ _id: placementId }, { _id: 1 });
    if (!placement) throw createError(404, `No placement exists for ID '${placementId}'`);

    const template = await Template.findOne({ _id: templateId }, { html: 1, fallback: 1 });
    if (!template) throw createError(404, `No template exists for ID '${templateId}'`);

    /**
     * @todo
     * The ad selection algo would now run, find the appropriate ad (or ads), and replace
     * the template's merge variables. Also, replace any custom merge variables. For now, simulate.
     */
    const campaigns = await Campaign.find().limit(limit);

    const ads = [];
    const reqs = [];
    /**
     * @todo The request tracking implementation *definitely* needs work.
     * Some sort of pre-aggregation should exist.
     * The campaign id may not always be required (what if no ads were returned?).
     * Merge variables also need to be stored on the request.
     */
    campaigns.forEach((campaign) => {
      const cid = campaign.get('id');
      const request = new Request({ cid, pid: placementId });
      reqs.push(request);

      const correlator = this.createCorrelator(requestURL, request.get('id'));
      const html = template.html
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
