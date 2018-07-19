const { paginationResolvers } = require('@limit0/mongoose-graphql-pagination');
const Advertiser = require('../../models/advertiser');
const Campaign = require('../../models/campaign');
const ContactRepo = require('../../repositories/contact');
const Image = require('../../models/image');

module.exports = {
  /**
   *
   */
  Advertiser: {
    campaigns: advertiser => Campaign.find({ advertiserId: advertiser.id }),
    campaignCount: advertiser => Campaign.find({ advertiserId: advertiser.id }).count(),
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
    advertiser: (root, { input }, { auth }) => {
      auth.check();
      const { id } = input;
      return Advertiser.strictFindById(id);
    },

    /**
     *
     */
    advertiserHash: async (root, { input }) => {
      const { hash } = input;
      return Advertiser.strictFindOne({ pushId: hash });
    },

    /**
     *
     */
    allAdvertisers: (root, { pagination, sort }, { auth }) => {
      auth.check();
      return Advertiser.paginate({ pagination, sort });
    },

    /**
     *
     */
    autocompleteAdvertisers: async (root, { pagination, phrase }, { auth }) => {
      auth.check();
      return Advertiser.autocomplete(phrase, { pagination });
    },

    /**
     *
     */
    searchAdvertisers: async (root, { pagination, phrase }, { auth }) => {
      auth.check();
      return Advertiser.search(phrase, { pagination });
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
      return Advertiser.create(payload);
    },

    /**
     *
     */
    updateAdvertiser: (root, { input }, { auth }) => {
      auth.check();
      const { id, payload } = input;
      return Advertiser.findAndSetUpdate(id, payload);
    },

    /**
     *
     */
    advertiserLogo: async (root, { input }, { auth }) => {
      auth.check();
      const { id, imageId } = input;
      const advertiser = await Advertiser.strictFindById(id);
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
