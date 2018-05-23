const paginationResolvers = require('./pagination');
const AdvertiserRepo = require('../../repositories/advertiser');
const PlacementRepo = require('../../repositories/placement');
const CampaignRepo = require('../../repositories/campaign');
const ClientRepo = require('../../repositories/campaign/client');
const CreativeRepo = require('../../repositories/campaign/creative');
const CriteriaRepo = require('../../repositories/campaign/criteria');
const ContactRepo = require('../../repositories/contact');
const Campaign = require('../../models/campaign');
const contactNotifier = require('../../services/contact-notifier');

const getNotifyDefaults = async (advertiserId, user) => {
  const advertiser = await AdvertiserRepo.findById(advertiserId);
  const notify = {
    internal: await advertiser.get('notify.internal'),
    external: await advertiser.get('notify.external'),
  };
  const contact = await ContactRepo.getOrCreateFor(user);
  notify.internal.push(contact.id);
  return notify;
};

module.exports = {
  /**
   *
   */
  Campaign: {
    advertiser: campaign => AdvertiserRepo.findById(campaign.get('advertiserId')),
    notify: async (campaign) => {
      const internal = await ContactRepo.find({ _id: { $in: campaign.notify.internal } });
      const external = await ContactRepo.find({ _id: { $in: campaign.notify.external } });
      return { internal, external };
    },
    internalLinks: (campaign) => {
      const { SERVER_BASE_URL } = process.env;
      const { hash } = campaign;
      return [
        {
          label: 'Material Collect',
          url: `${SERVER_BASE_URL}/go-to/collect/${hash}`
        },
        {
          label: 'Report: Summary',
          url: `${SERVER_BASE_URL}/go-to/report-summary/${hash}`
        },
        {
          label: 'Report: Creative Breakdown',
          url: `${SERVER_BASE_URL}/go-to/report-creative-breakdown/${hash}`
        },
      ]
    },
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
    campaignCreative: (root, { input }, { auth }) => {
      auth.check();
      const { campaignId, creativeId } = input;
      return CreativeRepo.findFor(campaignId, creativeId);
    },

    /**
     *
     */
    campaignHash: async (root, { input }) => {
      const { hash } = input;
      const record = await ClientRepo.findByHash(hash);
      if (!record) throw new Error(`No campaign record found for hash ${hash}.`);
      return record;
    },

    /**
     *
     */
    allCampaigns: (root, { pagination, sort }, { auth }) => {
      auth.check();
      return CampaignRepo.paginate({ pagination, sort });
    },

    /**
     *
     */
    searchCampaigns: (root, { pagination, phrase }, { auth }) => {
      auth.check();
      return CampaignRepo.search(phrase, { pagination });
    },
  },

  /**
   *
   */
  Mutation: {
    /**
     *
     */
    createCampaign: async (root, { input }, { auth }) => {
      auth.check();
      const { payload } = input;
      payload.criteria = { start: payload.startDate };
      payload.notify = await getNotifyDefaults(payload.advertiserId, auth.user);
      const campaign = await CampaignRepo.create(payload);
      contactNotifier.sendInternalCampaignCreated({ campaign });
      contactNotifier.sendExternalCampaignCreated({ campaign });
      return campaign;
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
    updateCampaignCreativeDetails: async (root, { input }, { auth }) => {
      auth.check();
      const { campaignId, creativeId, payload } = input;
      const { title, teaser, status } = payload;
      return CreativeRepo.updateDetailsFor(campaignId, creativeId, { title, teaser, status });
    },

    /**
     *
     */
    updateCampaignCreativeImage: async (root, { input }, { auth }) => {
      auth.check();
      const { campaignId, creativeId, payload } = input;
      return CreativeRepo.updateImageFor(campaignId, creativeId, payload);
    },

    /**
     *
     */
    campaignCreativeStatus: async (root, { input }, { auth }) => {
      auth.check();
      const { campaignId, creativeId, status } = input;
      return CreativeRepo.setStatusFor(campaignId, creativeId, status);
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
    clientAddCampaignCreative: (root, { input }) => {
      const { campaignId, payload } = input;
      return CreativeRepo.createFor(campaignId, payload);
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

    /**
     *
     */
    addCampaignContact: (root, { input }, { auth }) => {
      auth.check();
      const { id, type, contactId } = input;
      return ContactRepo.addContactTo(Campaign, id, type, contactId);
    },

    /**
     *
     */
    removeCampaignContact: (root, { input }, { auth }) => {
      auth.check();
      const { id, type, contactId } = input;
      return ContactRepo.removeContactFrom(Campaign, id, type, contactId);
    },

    /**
     *
     */
    setCampaignContacts: (root, { input }, { auth }) => {
      auth.check();
      const { id, type, contactIds } = input;
      return ContactRepo.setContactsFor(Campaign, id, type, contactIds);
    },
  },
};
