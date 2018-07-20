const { Schema } = require('mongoose');

const getDefinition = ({ type, Model, options }) => ({
  ...options,
  type: type || Schema.Types.ObjectId,
  ref: Model.modelName,
  validate: {
    async validator(id) {
      if (!options.required && !id) return true;
      const doc = await Model.findById(id, { _id: 1 });
      if (doc) return true;
      return false;
    },
    message: `No ${Model.modelName} record was found for ID {VALUE}`,
  },
});

module.exports = function referencePlugin(schema, {
  name,
  type,
  many = false,
  Model,
  options = {},
} = {}) {
  const definition = getDefinition({ type, Model, options });
  if (many) {
    schema.add([{ [name]: definition }]);
  } else {
    schema.add({ [name]: definition });
  }
};
