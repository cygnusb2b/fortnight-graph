const generators = require('./generators');
const Result = require('./result');

module.exports = async (Model, count = 10, params = {}) => {
  const { modelName } = Model;
  const result = Result();
  const Generate = generators[modelName];

  if (!Generate) throw new Error(`No generator found for model named '${modelName}'.`);
  const promises = [];
  for (let i = 0; i < count; i += 1) {
    promises.push(Generate(params));
  }
  const r = await Promise.all(promises);
  r.forEach(props => result.add(new Model(props)));
  return result;
};
