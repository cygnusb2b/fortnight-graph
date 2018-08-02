const { paginationResolvers } = require('@limit0/mongoose-graphql-pagination');
const userAttributionFields = require('./user-attribution');
const Advertiser = require('../../models/advertiser');
const Campaign = require('../../models/campaign');
const Story = require('../../models/story');
const Image = require('../../models/image');
const accountService = require('../../services/account');
const storyUrl = require('../../utils/story-url');

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
    primaryImage: story => Image.findById(story.primaryImageId),
    images: story => Image.find({ _id: { $in: story.imageIds } }),
    campaigns: (story, { pagination, sort }) => {
      const criteria = { storyId: story.id, deleted: false };
      return Campaign.paginate({ pagination, criteria, sort });
    },
    previewUrl: async (story) => {
      const account = await accountService.retrieve();
      return `${storyUrl(account.storyUri, story.id)}/?preview=true`;
    },
    ...userAttributionFields,
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
        publishedAt,
      } = payload;

      const story = new Story({
        title,
        advertiserId,
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
        publishedAt,
      } = payload;

      const story = await Story.strictFindActiveById(id);
      story.setUserContext(auth.user);
      story.set({
        title,
        teaser,
        body,
        advertiserId,
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
