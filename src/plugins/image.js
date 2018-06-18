const { Schema } = require('mongoose');
const connection = require('../connections/mongoose/instance');

const getDefinition = ({ required = false }) => ({
  type: Schema.Types.ObjectId,
  ref: 'image',
  required,
  validate: {
    async validator(v) {
      const doc = await connection.model('image').findById(v, { _id: 1 });
      if (doc) return true;
      return false;
    },
    message: 'No image record was found for ID {VALUE}',
  },
});

const addSingleField = (schema, { fieldName, required }) => {
  schema.add({
    [fieldName]: getDefinition({ required }),
  });
};

const addMultiField = (schema, { fieldName, required }) => {
  schema.add({
    [fieldName]: [getDefinition({ required })],
  });

  // eslint-disable-next-line no-param-reassign
  schema.methods.addImageId = function addImageId(imageId) {
    const ids = Array.isArray(this[fieldName]) ? this[fieldName] : [];
    const current = ids.map(id => `${id}`);
    current.push(`${imageId}`);
    this[fieldName] = [...new Set(current)];
  };

  // eslint-disable-next-line no-param-reassign
  schema.methods.removeImageId = function removeImageId(imageId) {
    const ids = Array.isArray(this[fieldName]) ? this[fieldName] : [];
    const filtered = ids.filter(id => `${id}` !== `${imageId}`);
    this[fieldName] = filtered;
  };
};

module.exports = function imagePlugin(schema, options = {}) {
  const { fieldName, multiple } = options;
  if (!fieldName) throw new Error('The fieldName option is required when adding an image relationship.');
  if (multiple) {
    addMultiField(schema, options);
  } else {
    addSingleField(schema, options);
  }
};
