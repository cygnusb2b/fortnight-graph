const generators = require('./generators');
const Result = require('./result');

module.exports = (Model, count = 10, params = {}) => {
  const { modelName } = Model;
  const result = Result();
  const Generate = generators[modelName];

  if (!Generate) throw new Error(`No generator found for model named '${modelName}'.`);
  for (let i = 0; i < count; i += 1) {
    const model = new Model(Generate(params));
    result.add(model);
  }
  return result;
};
