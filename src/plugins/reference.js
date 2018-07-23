const { Schema } = require('mongoose');

const getDefinition = ({
  type,
  connection,
  modelName,
  options,
}) => ({
  ...options,
  type: type || Schema.Types.ObjectId,
  ref: modelName,
  validate: {
    async validator(id) {
      if (!options.required && !id) return true;
      const doc = await connection.model(modelName).findById(id, { _id: 1 });
      if (doc) return true;
      return false;
    },
    message: `No ${modelName} record was found for ID {VALUE}`,
  },
});

module.exports = function referencePlugin(schema, {
  name,
  type,
  many = false,
  connection,
  modelName,
  options = {},
} = {}) {
  const definition = getDefinition({
    type,
    connection,
    modelName,
    options,
  });
  if (many) {
    schema.add([{ [name]: definition }]);
  } else {
    schema.add({ [name]: definition });
  }
};
