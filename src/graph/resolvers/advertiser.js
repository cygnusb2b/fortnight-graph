const CampaignRepo = require('../../repositories/campaign');
const AdvertiserRepo = require('../../repositories/advertiser');
const ContactRepo = require('../../repositories/contact');
const Advertiser = require('../../models/advertiser');
const paginationResolvers = require('./pagination');
const elastic = require('../../elastic');

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

      // @todo If the phrase matches an ID, return the model as an array.
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

      const totalCount = await elastic.count(index, type, { query });

      const { first, after } = pagination;
      const results = await elastic.search(index, type, {
        size: first || 20,
        query,
        search_after: after || undefined,
        sort: [
          { _score: 'desc' },
          { _id: 'desc' },
        ],
      }, { searchType: 'dfs_query_then_fetch' });

      const { total, hits } = results.hits;

      const mapped = hits.reduce((obj, hit) => ({
        ...obj,
        [hit._id]: {
          score: hit._score, // eslint-disable-line no-underscore-dangle
          sort: hit.sort,
        },
      }), {});

      const mapVal = (doc, prop) => mapped[doc._id.toString()][prop];

      const advertisers = await Advertiser.find({ _id: { $in: Object.keys(mapped) } });
      const sorted = advertisers.sort((a, b) => mapVal(b, 'score') - mapVal(a, 'score'));

      return {
        getTotalCount: () => totalCount.count,
        getEdges: () => sorted.map(node => ({
          node,
          cursor: mapVal(node, 'sort'),
        })),
        hasNextPage: () => (total >= totalCount.count),
        getEndCursor: () => {
          const last = hits[total - 1];
          return last ? JSON.stringify(last.sort) : null;
        },
      };
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
