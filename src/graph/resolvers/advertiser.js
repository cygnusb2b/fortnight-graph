const { paginationResolvers, Pagination } = require('@limit0/mongoose-graphql-pagination');
const Advertiser = require('../../models/advertiser');
const AdvertiserRepo = require('../../repositories/advertiser');
const Campaign = require('../../models/campaign');
const ContactRepo = require('../../repositories/contact');
const Image = require('../../models/image');
const User = require('../../models/user');

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
    createdBy: advertiser => User.findById(advertiser.createdById),
    updatedBy: advertiser => User.findById(advertiser.updatedById),
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
      const { user } = auth;
      const { payload } = input;

      return Advertiser.create({
        ...payload,
        createdById: user.id,
        updatedById: user.id,
      });
    },

    /**
     *
     */
    updateAdvertiser: async (root, { input }, { auth }) => {
      auth.check();
      const { user } = auth;
      const { id, payload } = input;
      const { name, logo } = payload;

      const advertiser = await Advertiser.findById(id);
      if (!advertiser) throw new Error(`No advertiser found for ID '${id}'.`);
      advertiser.set({
        name,
        logo,
        updatedById: user.id,
      });
      return advertiser.save();
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
      const { user } = auth;
      const { id, imageId } = input;
      const advertiser = await Advertiser.findById(id);
      if (!advertiser) throw new Error(`Unable to set advertiser logo: no record found for ID ${id}.`);
      advertiser.set({
        logoImageId: imageId,
        updatedById: user.id,
      });
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
