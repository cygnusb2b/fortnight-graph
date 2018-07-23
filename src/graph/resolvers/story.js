const { paginationResolvers } = require('@limit0/mongoose-graphql-pagination');
const Advertiser = require('../../models/advertiser');
const Story = require('../../models/story');
const Image = require('../../models/image');

module.exports = {
  Story: {
    advertiser: story => Advertiser.findById(story.advertiserId),
    primaryImage: story => Image.findById(story.primaryImageId),
    images: story => Image.find({ _id: { $in: story.imageIds } }),
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
      return Story.strictFindById(id);
    },

    /**
     *
     */
    allStories: (root, { pagination, sort }) => Story.paginate({ pagination, sort }),

    /**
     *
     */
    searchStories: (root, { pagination, phrase }) => Story.search(phrase, { pagination }),

    /**
     *
     */
    autocompleteStories: async (root, { pagination, phrase }) => Story
      .autocomplete(phrase, { pagination }),
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
      return Story.create(payload);
    },

    /**
     *
     */
    updateStory: (root, { input }, { auth }) => {
      auth.check();
      const { id, payload } = input;
      return Story.findAndSetUpdate(id, payload);
    },

    /**
     *
     */
    removeStoryImage: async (root, { storyId, imageId }, { auth }) => {
      auth.check();
      const story = await Story.strictFindById(storyId);
      story.removeImageId(imageId);
      return story.save();
    },

    /**
     *
     */
    addStoryImage: async (root, { storyId, imageId }, { auth }) => {
      auth.check();
      const story = await Story.strictFindById(storyId);
      story.addImageId(imageId);
      return story.save();
    },

    /**
     *
     */
    storyPrimaryImage: async (root, { storyId, imageId }, { auth }) => {
      auth.check();
      const story = await Story.strictFindById(storyId);
      story.primaryImageId = imageId || undefined;
      return story.save();
    },
  },
};
