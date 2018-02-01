const generators = require('./generators');
const Result = require('./result');

module.exports = (Model, count = 10, params = {}) => {
  const name = Model.modelName;
  const result = Result();
  const Generate = generators[name];

  if (!Generate) return result;
  for (let i = 0; i < count; i += 1) {
    const model = new Model(Generate(params));
    result.add(model);
  }
  return result;
};

