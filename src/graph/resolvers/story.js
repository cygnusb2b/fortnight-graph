const { paginationResolvers } = require('@limit0/mongoose-graphql-pagination');
const moment = require('moment');
const userAttributionFields = require('./user-attribution');
const Advertiser = require('../../models/advertiser');
const Campaign = require('../../models/campaign');
const Publisher = require('../../models/publisher');
const Story = require('../../models/story');
const Image = require('../../models/image');

const storySearchFilter = [
  {
    bool: {
      must: [
        { term: { deleted: false } },
        { term: { placeholder: false } },
      ],
    },
  },
];

module.exports = {
  Story: {
    // @todo Determine if this should run a strict/active find.
    // Ultimately, deleting an advertiser should delete it's stories?
    advertiser: story => Advertiser.findById(story.advertiserId),
    publisher: story => Publisher.findById(story.publisherId),
    primaryImage: story => Image.findById(story.primaryImageId),
    images: story => Image.find({ _id: { $in: story.imageIds } }),
    campaigns: (story, { pagination, sort }) => {
      const criteria = { storyId: story.id, deleted: false };
      return Campaign.paginate({ pagination, criteria, sort });
    },
    previewUrl: story => story.getUrl(true),
    url: story => story.getUrl(),
    hash: story => story.pushId,
    path: story => story.getPath(),
    ...userAttributionFields,
  },

  StorySitemapItem: {
    loc: async (story) => {
      const url = await story.getUrl();
      /**
       * Per the sitemap entity escaping section
       * @see https://www.sitemaps.org/protocol.html#escaping
       */
      return url
        .replace('&', '&amp;')
        .replace('\'', '&apos;')
        .replace('"', '&quot;')
        .replace('>', '&gt;')
        .replace('<', '&lt;');
    },
    lastmod: ({ updatedAt }) => (updatedAt ? moment(updatedAt).toISOString() : null),
    changefreq: () => 'monthly',
    priority: () => 0.5,
    image: ({ primaryImageId }) => {
      if (!primaryImageId) return null;
      return Image.findById(primaryImageId);
    },
  },

  StorySitemapImage: {
    loc: image => image.getSrc(),
    caption: () => null,
  },

  /**
   *
   */
  StoryConnection: paginationResolvers.connection,

  /**
   *
   */
  Query: {
    /**
     *
     */
    story: (root, { input }) => {
      const { id } = input;
      return Story.strictFindActiveById(id);
    },

    /**
     *
     */
    publishedStory: async (root, { input }) => {
      const { id, preview } = input;
      const story = await Story.strictFindActiveById(id);
      if (preview) return story;
      const { publishedAt } = story;
      if (!publishedAt || publishedAt.valueOf() > Date.now()) {
        throw new Error(`No story found for ID '${id}'`);
      }
      return story;
    },

    /**
     *
     */
    storyHash: (root, { input }) => {
      const { advertiserId, hash } = input;
      return Story.strictFindActiveOne({ advertiserId, pushId: hash });
    },

    /**
     *
     */
    allStories: (root, { pagination, sort }) => {
      const criteria = {
        deleted: false,
        placeholder: false,
      };
      return Story.paginate({ criteria, pagination, sort });
    },

    /**
     *
     */
    publishedStories: (root, { pagination, sort }) => {
      const criteria = {
        deleted: false,
        placeholder: false,
        publishedAt: { $lte: new Date() },
      };
      return Story.paginate({ criteria, pagination, sort });
    },

    storySitemap: () => {
      const criteria = {
        deleted: false,
        placeholder: false,
        publishedAt: { $lte: new Date() },
      };
      return Story.find(criteria).sort({ publishedAt: -1 });
    },

    /**
     *
     */
    searchStories: (root, { pagination, phrase }) => Story
      .search(phrase, { pagination, filter: storySearchFilter }),

    /**
     *
     */
    autocompleteStories: async (root, { pagination, phrase }) => Story
      .autocomplete(phrase, { pagination, filter: storySearchFilter }),
  },
  /**
   *
   */
  Mutation: {
    /**
     *
     */
    createStory: (root, { input }, { auth }) => {
      auth.check();
      const { payload } = input;
      const {
        title,
        advertiserId,
        publisherId,
        publishedAt,
      } = payload;

      const story = new Story({
        title,
        advertiserId,
        publisherId,
        publishedAt,
      });
      story.setUserContext(auth.user);
      return story.save();
    },

    /**
     *
     */
    deleteStory: async (root, { input }, { auth }) => {
      auth.check();
      const { id } = input;
      const story = await Story.strictFindActiveById(id);
      story.setUserContext(auth.user);
      return story.softDelete();
    },

    /**
     *
     */
    updateStory: async (root, { input }, { auth }) => {
      auth.check();
      const { id, payload } = input;
      const {
        title,
        teaser,
        body,
        advertiserId,
        publisherId,
        publishedAt,
      } = payload;

      const story = await Story.strictFindActiveById(id);
      story.setUserContext(auth.user);
      story.set({
        title,
        teaser,
        body,
        advertiserId,
        publisherId,
        publishedAt,
      });
      return story.save();
    },

    /**
     *
     */
    removeStoryImage: async (root, { storyId, imageId }, { auth }) => {
      const story = await Story.strictFindActiveById(storyId);
      auth.checkAdvertiserAccess(story.advertiserId);
      if (auth.user) {
        story.setUserContext(auth.user);
      }
      story.removeImageId(imageId);
      return story.save();
    },

    /**
     *
     */
    addStoryImage: async (root, { storyId, imageId }, { auth }) => {
      const story = await Story.strictFindActiveById(storyId);
      auth.checkAdvertiserAccess(story.advertiserId);
      if (auth.user) {
        story.setUserContext(auth.user);
      }
      story.addImageId(imageId);
      return story.save();
    },

    /**
     *
     */
    storyPrimaryImage: async (root, { storyId, imageId }, { auth }) => {
      const story = await Story.strictFindActiveById(storyId);
      auth.checkAdvertiserAccess(story.advertiserId);
      story.primaryImageId = imageId || undefined;
      if (auth.user) {
        story.setUserContext(auth.user);
      }
      return story.save();
    },

    /**
     *
     */
    storyTitle: async (root, { id, value }, { auth }) => {
      const story = await Story.strictFindActiveById(id);
      auth.checkAdvertiserAccess(story.advertiserId);

      if (auth.user) {
        story.setUserContext(auth.user);
      }
      if (story.placeholder === true) {
        story.placeholder = false;
      }
      story.title = value;
      return story.save();
    },

    /**
     *
     */
    storyTeaser: async (root, { id, value }, { auth }) => {
      const story = await Story.strictFindActiveById(id);
      auth.checkAdvertiserAccess(story.advertiserId);

      if (auth.user) {
        story.setUserContext(auth.user);
      }
      story.teaser = value;
      return story.save();
    },

    /**
     *
     */
    storyBody: async (root, { id, value }, { auth }) => {
      const story = await Story.strictFindActiveById(id);
      auth.checkAdvertiserAccess(story.advertiserId);

      if (auth.user) {
        story.setUserContext(auth.user);
      }
      story.body = value;
      return story.save();
    },

    /**
     *
     */
    storyPublishedAt: async (root, { id, value }, { auth }) => {
      const story = await Story.strictFindActiveById(id);
      auth.checkAdvertiserAccess(story.advertiserId);

      if (value) {
        ['title', 'body', 'primaryImageId'].forEach((key) => {
          if (!story.get(key)) {
            throw new Error(`You must set the story's ${key} before publishing.`);
          }
        });
      }
      if (auth.user) {
        story.setUserContext(auth.user);
      }
      story.publishedAt = value;
      return story.save();
    },
  },
};
