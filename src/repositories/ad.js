const Placement = require('../models/placement');
const Campaign = require('../models/campaign');

module.exports = {
  async findFor({ pid, limit } = {}) {
    if (!pid) throw new Error('No placement ID was provided.');

    /**
     * @todo
     * Do we need to confirm the placement id?
     * If it doesn't exist, the ad algorithm wouldn't return any ads.
     * We do need it for the template, though that could be saved along with the schedule?
     * Or the pre-query?
     */
    const placement = await Placement.findOne({ pid }, { pid: 1, template: 1 });
    if (!placement) throw new Error(`No placement exists for pid '${pid}'`);

    /**
     * @todo
     * The ad selection algo would now run, find the appropriate ad (or ads), and replace
     * the template's merge variables. For now, simulate.
     */
    const l = limit > 0 ? limit : 1;
    if (l > 20) throw new Error('You cannot return more than 20 ads in one request.');
    const campaigns = await Campaign.find().limit(l);

    const ads = [];
    campaigns.forEach((campaign) => {
      const html = placement.template
        .replace(/{{ id }}/g, campaign.get('id'))
        /**
         * @todo This needs to use the campaign creative title, not name.
         */
        .replace(/{{ title }}/g, campaign.get('name'));

      ads.push({ name: campaign.name, html });
    });
    return ads;
  },
};
