const CampaignRepo = require('../../repositories/campaign');
const AdvertiserRepo = require('../../repositories/advertiser');
const ContactRepo = require('../../repositories/contact');
const Advertiser = require('../../models/advertiser');
const paginationResolvers = require('./pagination');
const elastic = require('../../elastic');
const SearchPagination = require('../../classes/elastic/pagination');

module.exports = {
  /**
   *
   */
  Advertiser: {
    campaigns: advertiser => CampaignRepo.findForAdvertiser(advertiser.id),
    campaignCount: advertiser => CampaignRepo.findForAdvertiser(advertiser.id).count(),
  },

  /**
   *
   */
  AdvertiserConnection: paginationResolvers.connection,

  /**
   *
   */
  AdvertiserEdge: paginationResolvers.edge,

  /**
   *
   */
  Query: {
    /**
     *
     */
    advertiser: async (root, { input }, { auth }) => {
      auth.check();
      const { id } = input;
      const record = await AdvertiserRepo.findById(id);
      if (!record) throw new Error(`No advertiser record found for ID ${id}.`);
      return record;
    },

    /**
     *
     */
    allAdvertisers: (root, { pagination, sort }, { auth }) => {
      auth.check();
      return AdvertiserRepo.paginate({ pagination, sort });
    },

    /**
     *
     */
    searchAdvertisers: async (root, { pagination, phrase }, { auth }) => {
      auth.check();
      if (/[a-f0-9]{24}/.test(phrase)) {
        const criteria = { _id: phrase };
        return AdvertiserRepo.paginate({ pagination, criteria });
      }

      const { index, type } = Advertiser.esOptions();
      const query = {
        bool: {
          should: [
            { match: { 'name.exact': { query: phrase, boost: 10 } } },
            { match: { name: { query: phrase, operator: 'and', boost: 5 } } },
            { match: { 'name.phonetic': { query: phrase, boost: 3 } } },
            { match: { 'name.edge': { query: phrase, operator: 'and', boost: 2 } } },
            { match: { 'name.edge': { query: phrase, boost: 1 } } },
            { match: { 'name.ngram': { query: phrase, operator: 'and', boost: 0.5 } } },
            { match: { 'name.ngram': { query: phrase } } },
          ],
        },
      };
      const params = {
        index,
        type,
        body: { query },
        searchType: 'dfs_query_then_fetch',
      };
      return new SearchPagination(Advertiser, elastic.client, { params, pagination });
    },
  },

  /**
   *
   */
  Mutation: {
    /**
     *
     */
    createAdvertiser: (root, { input }, { auth }) => {
      auth.check();
      const { payload } = input;
      return AdvertiserRepo.create(payload);
    },

    /**
     *
     */
    updateAdvertiser: (root, { input }, { auth }) => {
      auth.check();
      const { id, payload } = input;
      return AdvertiserRepo.update(id, payload);
    },

    /**
     *
     */
    addAdvertiserContact: (root, { input }, { auth }) => {
      auth.check();
      const { id, type, contactId } = input;
      return ContactRepo.addContactTo(Advertiser, id, type, contactId);
    },

    /**
     *
     */
    removeAdvertiserContact: (root, { input }, { auth }) => {
      auth.check();
      const { id, type, contactId } = input;
      return ContactRepo.removeContactFrom(Advertiser, id, type, contactId);
    },

    /**
     *
     */
    setAdvertiserContacts: (root, { input }, { auth }) => {
      auth.check();
      const { id, type, contactIds } = input;
      return ContactRepo.setContactsFor(Advertiser, id, type, contactIds);
    },
  },
};
