const { paginationResolvers } = require('@limit0/mongoose-graphql-pagination');
const Advertiser = require('../../models/advertiser');
const Story = require('../../models/story');
const Image = require('../../models/image');
const User = require('../../models/user');

const storySearchFilter = [
  { term: { deleted: false } },
  {
    bool: {
      should: [
        { term: { status: 'Ready' } },
        { term: { status: 'Draft' } },
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
      return Story.strictFindActiveById(id);
    },

    /**
     *
     */
    allStories: (root, { pagination, sort }) => {
      const criteria = {
        deleted: false,
        status: { $in: ['Ready', 'Draft'] },
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
      const { user } = auth;
      const { payload } = input;
      const {
        title,
        advertiserId,
        publishedAt,
      } = payload;
      const status = publishedAt ? 'Ready' : 'Draft';

      return Story.create({
        title,
        advertiserId,
        publishedAt,
        status,
        createdById: user.id,
        updatedById: user.id,
      });
    },

    /**
     *
     */
    deleteStory: async (root, { input }, { auth }) => {
      auth.check();
      const { id } = input;
      const story = await Story.strictFindActiveById(id);
      return story.softDelete();
    },

    /**
     *
     */
    updateStory: async (root, { input }, { auth }) => {
      auth.check();
      const { user } = auth;
      const { id, payload } = input;
      const {
        title,
        teaser,
        body,
        advertiserId,
        publishedAt,
        status,
      } = payload;

      const story = await Story.strictFindActiveById(id);
      story.set({
        title,
        teaser,
        body,
        advertiserId,
        publishedAt,
        status,
        updatedById: user.id,
      });
      return story.save();
    },

    /**
     *
     */
    removeStoryImage: async (root, { storyId, imageId }, { auth }) => {
      auth.check();
      const story = await Story.strictFindActiveById(storyId);
      story.removeImageId(imageId);
      return story.save();
    },

    /**
     *
     */
    addStoryImage: async (root, { storyId, imageId }, { auth }) => {
      auth.check();
      const story = await Story.strictFindActiveById(storyId);
      story.addImageId(imageId);
      return story.save();
    },

    /**
     *
     */
    storyPrimaryImage: async (root, { storyId, imageId }, { auth }) => {
      auth.check();
      const story = await Story.strictFindActiveById(storyId);
      story.primaryImageId = imageId || undefined;
      return story.save();
    },
  },
};
