const { paginationResolvers } = require('@limit0/mongoose-graphql-pagination');
const Advertiser = require('../../models/advertiser');
const Story = require('../../models/story');
const Image = require('../../models/image');
const User = require('../../models/user');

module.exports = {
  Story: {
    advertiser: story => Advertiser.findById(story.advertiserId),
    primaryImage: story => Image.findById(story.primaryImageId),
    images: story => Image.find({ _id: { $in: story.imageIds } }),
    createdBy: story => User.findById(story.createdById),
    updatedBy: story => User.findById(story.updatedById),
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
    allStories: (root, { input, pagination, sort }) => {
      const { dispositions } = input;
      const criteria = {
        disposition: { $in: dispositions.length ? dispositions : ['Ready', 'Draft'] },
      };
      return Story.paginate({ criteria, pagination, sort });
    },

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
      const {
        title,
        advertiserId,
        publishedAt,
      } = payload;
      const disposition = publishedAt ? 'Ready' : 'Draft';

      return Story.create({
        title,
        advertiserId,
        publishedAt,
        disposition,
        createdById: auth.user.id,
        updatedById: auth.user.id,
      });
    },

    /**
     *
     */
    deleteStory: async (root, { input }, { auth }) => {
      auth.check();
      const { id } = input;
      const story = await Story.findById(id);
      if (!story) throw new Error(`No story found for ID '${id}'.`);
      story.disposition = 'Deleted';
      return story.save();
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

      const story = await Story.findById(id);
      if (!story) throw new Error(`Unable to update story: no record was found for ID '${id}'`);

      let disposition = publishedAt ? 'Ready' : 'Draft';
      if (story.disposition === 'Deleted') disposition = 'Deleted';

      story.set({
        title,
        teaser,
        body,
        advertiserId,
        publishedAt,
        disposition,
        updatedById: auth.user.id,
      });
      return story.save();
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
