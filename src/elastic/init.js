const Promise = require('bluebird');
const models = require('./models');
const output = require('../output');

const emitMap = (index, type) => output.write(`ElasticSearch mappings for '${index}/${type}' successfully set.`);
const emitSync = (index, type) => output.write(`ElasticSearch populate for '${index}/${type}' complete.`);

const initializeFor = async (Model, elastic, recreate = false) => {
  const { index, type } = Model.esOptions();
  if (recreate) {
    await elastic.deleteIndex(index);
  }
  const exists = await elastic.indexExists(index);
  if (!exists) {
    // Create mappings for the model in Elastic.
    await Model.esCreateMapping().then(() => emitMap(index, type));
    // Populate/sync the data from MongoDB to Elastic.
    await Model.esSynchronize().then(() => emitSync(index, type));
  }
};

let promises;
const initialize = (elastic, recreate = false) => {
  if (!promises) {
    promises = Promise.all(models.map(Model => initializeFor(Model, elastic, recreate)));
  }
  return promises;
};

module.exports = initialize;
