const Image = require('../../models/image');

module.exports = {
  /**
   *
   */
  Mutation: {
    /**
     *
     */
    imageDimensions: async (root, { input }, { auth }) => {
      auth.check();
      const { id, width, height } = input;
      const image = await Image.findById(id);
      if (!image) throw new Error(`Unable to set image dimensions: no record was found for ID '${id}'`);
      image.set({ width, height });
      return image.save();
    },

    /**
     *
     */
    imageFocalPoint: async (root, { input }, { auth }) => {
      auth.check();
      const { id, x, y } = input;
      const image = await Image.findById(id);
      if (!image) throw new Error(`Unable to set image focal point: no record was found for ID '${id}'`);
      image.set({
        focalPoint: { x, y },
      });
      return image.save();
    },
  },
};
