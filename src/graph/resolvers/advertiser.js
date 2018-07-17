const { paginationResolvers, Pagination } = require('@limit0/mongoose-graphql-pagination');
const CampaignRepo = require('../../repositories/campaign');
const AdvertiserRepo = require('../../repositories/advertiser');
const ContactRepo = require('../../repositories/contact');
const Advertiser = require('../../models/advertiser');
const Campaign = require('../../models/campaign');
const Image = require('../../models/image');

module.exports = {
  /**
   *
   */
  Advertiser: {
    campaigns: (advertiser, { pagination, sort }) => {
      const criteria = { advertiserId: advertiser.id };
      return new Pagination(Campaign, { pagination, criteria, sort });
    },
    notify: async (advertiser) => {
      const internal = await ContactRepo.find({ _id: { $in: advertiser.notify.internal } });
      const external = await ContactRepo.find({ _id: { $in: advertiser.notify.external } });
      return { internal, external };
    },
    logo: advertiser => Image.findById(advertiser.logoImageId),
    hash: advertiser => advertiser.pushId,
  },

  /**
   *
   */
  AdvertiserConnection: paginationResolvers.connection,

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
      const record = await Advertiser.findById(id);
      if (!record) throw new Error(`No advertiser record found for ID ${id}.`);
      return record;
    },

    /**
     *
     */
    advertiserHash: async (root, { input }) => {
      const { hash } = input;
      const record = await Advertiser.findOneWherePresent({ pushId: hash });
      if (!record) throw new Error(`No advertiser record found for hash ${hash}.`);
      return record;
    },

    /**
     *
     */
    allAdvertisers: (root, { pagination, sort }, { auth }) => {
      auth.check();
      const criteria = { deleted: false };
      return AdvertiserRepo.paginate({ pagination, sort, criteria });
    },

    /**
     *
     */
    autocompleteAdvertisers: async (root, { pagination, phrase }, { auth }) => {
      auth.check();
      const mustNot = { term: { deleted: true } };
      return AdvertiserRepo.autocomplete(phrase, { pagination, mustNot });
    },

    /**
     *
     */
    searchAdvertisers: async (root, { pagination, phrase }, { auth }) => {
      auth.check();
      const mustNot = { term: { deleted: true } };
      return AdvertiserRepo.search(phrase, { pagination, mustNot });
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
     * @todo This should prevent delete when the advertiser has any active or scheduled campaigns.
     */
    deleteAdvertiser: async (root, { input }, { auth }) => {
      auth.check();
      const { id } = input;
      const advertiser = await Advertiser.findById(id);
      if (!advertiser) throw new Error(`No advertiser found for ID '${id}'.`);
      return advertiser.softDelete();
    },

    /**
     *
     */
    undeleteAdvertiser: async (root, { input }, { auth }) => {
      auth.check();
      const { id } = input;
      const advertiser = await Advertiser.findById(id);
      if (!advertiser) throw new Error(`No advertiser found for ID '${id}'.`);
      return advertiser.undelete();
    },

    /**
     *
     */
    advertiserLogo: async (root, { input }, { auth }) => {
      auth.check();
      const { id, imageId } = input;
      const advertiser = await Advertiser.findById(id);
      if (!advertiser) throw new Error(`Unable to set advertiser logo: no record found for ID ${id}.`);
      advertiser.logoImageId = imageId;
      return advertiser.save();
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
