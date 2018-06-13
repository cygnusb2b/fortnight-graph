const { paginationResolvers } = require('@limit0/mongoose-graphql-pagination');
const Advertiser = require('../../models/advertiser');
const Story = require('../../models/story');
const Image = require('../../models/image');
const StoryRepo = require('../../repositories/story');

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
    story: async (root, { input }) => {
      const { id } = input;
      const record = await Story.findById(id);
      if (!record) throw new Error(`No story record found for ID ${id}.`);
      return record;
    },

    /**
     *
     */
    allStories: (root, { pagination, sort }) => StoryRepo.paginate({ pagination, sort }),

    /**
     *
     */
    searchStories: (root, { pagination, phrase }) => StoryRepo.search(phrase, { pagination }),

    /**
     *
     */
    autocompleteStories: async (root, { pagination, phrase }) => StoryRepo
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
    updateStory: async (root, { input }, { auth }) => {
      auth.check();
      const { id, payload } = input;
      const story = await Story.findById(id);
      if (!story) throw new Error(`Unable to update story: no record was found for ID '${id}'`);
      story.set(payload);
      return story.save();
    },

    /**
     *
     */
    removeStoryImage: async (root, { storyId, imageId }, { auth }) => {
      auth.check();
      const story = await Story.findById(storyId);
      if (!story) throw new Error(`Unable to remove story image: no record was found for ID '${storyId}'`);
      story.removeImageId(imageId);
      return story.save();
    },

    /**
     *
     */
    addStoryImage: async (root, { storyId, imageId }, { auth }) => {
      auth.check();
      const story = await Story.findById(storyId);
      if (!story) throw new Error(`Unable to add story image: no record was found for ID '${storyId}'`);
      story.addImageId(imageId);
      return story.save();
    },
  },
};
