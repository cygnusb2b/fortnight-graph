const { paginationResolvers } = require('@limit0/mongoose-graphql-pagination');
const userAttributionFields = require('./user-attribution');
const AnalyticsEvent = require('../../models/analytics/event');
const Campaign = require('../../models/campaign');
const Image = require('../../models/image');
const Placement = require('../../models/placement');
const Publisher = require('../../models/publisher');
const Topic = require('../../models/topic');

module.exports = {
  /**
   *
   */
  Publisher: {
    logo: publisher => Image.findById(publisher.logoImageId),
    topics: (publisher, { pagination, sort }) => {
      const criteria = { publisherId: publisher.id, deleted: false };
      return Topic.paginate({ criteria, pagination, sort });
    },
    placements: (publisher, { pagination, sort }) => {
      const criteria = { publisherId: publisher.id, deleted: false };
      return Placement.paginate({ criteria, pagination, sort });
    },
    campaigns: async (publisher, { pagination, sort }) => {
      const placements = await Placement.find({ publisherId: publisher.id }, { _id: 1 });
      const placementIds = placements.map(placement => placement.id);
      const criteria = { 'criteria.placementIds': { $in: placementIds }, deleted: false };
      return Campaign.paginate({ criteria, pagination, sort });
    },
    metrics: async (publisher, { start, end }) => {
      const placements = await Placement.findActive({ publisherId: publisher.id }, { _id: 1 });
      const pipeline = [];
      pipeline.push({
        $match: {
          e: { $in: ['load-js', 'view-js', 'click-js'] },
          pid: { $in: placements.map(p => p._id) },
          d: { $gte: start, $lte: end },
        },
      });
      pipeline.push({
        $project: {
          view: { $cond: [{ $eq: ['$e', 'view-js'] }, 1, 0] },
          click: { $cond: [{ $eq: ['$e', 'click-js'] }, 1, 0] },
          load: { $cond: [{ $eq: ['$e', 'load-js'] }, 1, 0] },
        },
      });
      pipeline.push({
        $group: {
          _id: null,
          loads: { $sum: '$load' },
          views: { $sum: '$view' },
          clicks: { $sum: '$click' },
        },
      });
      pipeline.push({
        $project: {
          _id: 0,
          loads: 1,
          views: 1,
          clicks: 1,
          ctr: {
            $cond: {
              if: {
                $eq: ['$views', 0],
              },
              then: 0,
              else: {
                $divide: ['$clicks', '$views'],
              },
            },
          },
        },
      });

      const result = await AnalyticsEvent.aggregate(pipeline);
      return result[0] ? result[0] : {
        loads: 0,
        views: 0,
        clicks: 0,
        ctr: 0,
      };
    },
    ...userAttributionFields,
  },

  /**
   *
   */
  PublisherConnection: paginationResolvers.connection,

  /**
   *
   */
  Query: {
    /**
     *
     */
    publisher: (root, { input }, { auth }) => {
      auth.check();
      const { id } = input;
      return Publisher.strictFindActiveById(id);
    },

    /**
     *
     */
    allPublishers: (root, { pagination, sort }, { auth }) => {
      auth.check();
      const criteria = { deleted: false };
      return Publisher.paginate({ criteria, pagination, sort });
    },

    /**
     *
     */
    searchPublishers: (root, { pagination, phrase }, { auth }) => {
      auth.check();
      const filter = { term: { deleted: false } };
      return Publisher.search(phrase, { pagination, filter });
    },

    /**
     *
     */
    autocompletePublishers: (root, { pagination, phrase }, { auth }) => {
      auth.check();
      const filter = { term: { deleted: false } };
      return Publisher.autocomplete(phrase, { pagination, filter });
    },
  },

  /**
   *
   */
  Mutation: {
    /**
     *
     */
    createPublisher: (root, { input }, { auth }) => {
      auth.check();
      const { payload } = input;
      const publisher = new Publisher(payload);
      publisher.setUserContext(auth.user);
      return publisher.save();
    },

    /**
     *
     */
    updatePublisher: async (root, { input }, { auth }) => {
      auth.check();
      const { id, payload } = input;
      const publisher = await Publisher.strictFindActiveById(id);
      publisher.setUserContext(auth.user);
      publisher.set(payload);
      return publisher.save();
    },

    /**
     *
     */
    publisherLogo: async (root, { input }, { auth }) => {
      auth.check();
      const { id, imageId } = input;
      const publisher = await Publisher.strictFindActiveById(id);
      publisher.setUserContext(auth.user);
      publisher.logoImageId = imageId;
      return publisher.save();
    },

    /**
     *
     */
    deletePublisher: async (root, { input }, { auth }) => {
      auth.check();
      const { id } = input;
      const publisher = await Publisher.strictFindActiveById(id);
      publisher.setUserContext(auth.user);
      await publisher.softDelete();
      return 'ok';
    },
  },
};
