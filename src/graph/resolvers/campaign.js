const paginationResolvers = require('./pagination');
const AdvertiserRepo = require('../../repositories/advertiser');
const PlacementRepo = require('../../repositories/placement');
const CampaignRepo = require('../../repositories/campaign');
const ClientRepo = require('../../repositories/campaign/client');
const CreativeRepo = require('../../repositories/campaign/creative');
const CriteriaRepo = require('../../repositories/campaign/criteria');

module.exports = {
  /**
   *
   */
  Campaign: {
    advertiser: campaign => AdvertiserRepo.findById(campaign.get('advertiserId')),
  },

  CampaignCriteria: {
    placements: criteria => PlacementRepo.find({ _id: criteria.get('placementIds') }),
  },

  /**
   *
   */
  CampaignConnection: paginationResolvers.connection,

  /**
   *
   */
  CampaignEdge: paginationResolvers.edge,

  /**
   *
   */
  Query: {
    /**
     *
     */
    campaign: async (root, { input }, { auth }) => {
      auth.check();
      const { id } = input;
      const record = await CampaignRepo.findById(id);
      if (!record) throw new Error(`No campaign record found for ID ${id}.`);
      return record;
    },
    /**
     *
     */
    campaignHash: async (root, { input }) => {
      const { hash } = input;
      let record = await CampaignRepo.findByHash(hash);
      if (!record) throw new Error(`No campaign record found for hash ${hash}.`);
      if (!record.creatives[0]) {
        const campaignId = record.id;
        const payload = { title: null, teaser: null, image: null };
        await CreativeRepo.createFor(campaignId, payload);
        record = await CampaignRepo.findByHash(hash);
      }
      return record;
    },

    /**
     *
     */
    allCampaigns: (root, { pagination, sort }, { auth }) => {
      auth.check();
      return CampaignRepo.paginate({ pagination, sort });
    },
  },

  /**
   *
   */
  Mutation: {
    /**
     *
     */
    createCampaign: (root, { input }, { auth }) => {
      auth.check();
      const { payload } = input;
      return CampaignRepo.create(payload);
    },

    /**
     *
     */
    updateCampaign: (root, { input }, { auth }) => {
      auth.check();
      const { id, payload } = input;
      return CampaignRepo.update(id, payload);
    },

    /**
     *
     */
    addCampaignCreative: (root, { input }, { auth }) => {
      auth.check();
      const { campaignId, payload } = input;
      return CreativeRepo.createFor(campaignId, payload);
    },

    /**
     *
     */
    updateCampaignCreative: async (root, { input }, { auth }) => {
      auth.check();
      const { campaignId, creativeId, payload } = input;
      return CreativeRepo.updateFor(campaignId, creativeId, payload);
    },

    /**
     *
     */
    clientUpdateCampaign: async (root, { input }) => {
      const { campaignId, payload } = input;
      return ClientRepo.updateFor(campaignId, payload);
    },

    /**
     *
     */
    removeCampaignCreative: async (root, { input }, { auth }) => {
      auth.check();
      const { campaignId, creativeId } = input;
      await CreativeRepo.removeFrom(campaignId, creativeId);
      return 'ok';
    },

    /**
     *
     */
    setCampaignCriteria: async (root, { input }, { auth }) => {
      auth.check();
      const { campaignId, payload } = input;
      return CriteriaRepo.setFor(campaignId, payload);
    },
  },
};
