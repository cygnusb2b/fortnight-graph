const { paginationResolvers } = require('@limit0/mongoose-graphql-pagination');
const Advertiser = require('../../models/advertiser');
const Story = require('../../models/story');
const StoryRepo = require('../../repositories/story');

module.exports = {
  Story: {
    advertiser: story => Advertiser.findById(story.advertiserId),
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
    story: async (root, { input }, { auth }) => {
      auth.check();
      const { id } = input;
      const record = await StoryRepo.findById(id);
      if (!record) throw new Error(`No story record found for ID ${id}.`);
      return record;
    },

    /**
     *
     */
    allStories: (root, { pagination, sort }, { auth }) => {
      auth.check();
      return StoryRepo.paginate({ pagination, sort });
    },

    /**
     *
     */
    searchStories: (root, { pagination, phrase }, { auth }) => {
      auth.check();
      return StoryRepo.search(phrase, { pagination });
    },

    /**
     *
     */
    autocompleteStories: async (root, { pagination, phrase }, { auth }) => {
      auth.check();
      return StoryRepo.autocomplete(phrase, { pagination });
    },
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
    primaryImageStory: async (root, { input }, { auth }) => {
      auth.check();
      const { id, payload } = input;
      const story = await Story.findById(id);
      if (!story) throw new Error(`Unable to set story primary image: no record was found for ID '${id}'`);
      story.set('primaryImage', payload);
      return story.save();
    },

    /**
     *
     */
    storyImageDimensions: async (root, { input }, { auth }) => {
      auth.check();
      const { storyId, imageId, payload } = input;
      const { width, height } = payload;
      const story = await Story.findById(storyId);
      if (!story) throw new Error(`Unable to set dimensions: no story was found for ID '${storyId}'`);
      const image = story.images.id(imageId);
      if (!image) throw new Error(`Unable to set dimensions: no image was found for ID '${imageId}'`);
      image.set({ width, height });
      await story.save();
      return image;
    },
  },
};
