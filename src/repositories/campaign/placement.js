const createError = require('http-errors');
const querystring = require('querystring');
const Placement = require('../../models/placement');
const Template = require('../../models/template');
const Campaign = require('../../models/campaign');
const Request = require('../../models/request');

module.exports = {
  parseVariables(vars) {
    const { parse } = querystring;
    if (typeof vars !== 'string') return {};
    return parse(vars, ';', ':');
  },

  /**
   *
   * @param {object} params
   * @param {string} params.pid The placement identifier.
   * @param {string} params.pid The template identifier.
   * @param {string} params.url The URL the ad request came from.
   * @param {number} [params.limit=1] The number of ads to return. Max of 20.
   * @param {object} [params.custom] An object containing custom key/values.
   * @param {object} [params.merge] An object containing custom template merge key/values.
   */
  async findFor({
    pid,
    tid,
    url,
    limit = 1,
  } = {}) {
    if (!pid) throw createError(400, 'No placement ID was provided.');
    if (!tid) throw createError(400, 'No template ID was provided.');

    /**
     * @todo
     * Do we need to confirm the placement id?
     * If it doesn't exist, the ad algorithm wouldn't return any ads.
     * We do need it for the template, though, but could that be saved along with the schedule?
     * Or the pre-query?
     * We will need the pid for the request.
     */
    const placement = await Placement.findOne({ _id: pid }, { _id: 1 });
    if (!placement) throw createError(404, `No placement exists for pid '${pid}'`);

    const template = await Template.findOne({ _id: tid }, { html: 1, fallback: 1 });
    if (!template) throw createError(404, `No template exists for tid '${tid}'`);

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
      const cid = campaign.get('id');
      const request = new Request({ cid, pid });
      reqs.push(request);

      const correlator = this.createCorrelator(url, request.get('id'));
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
