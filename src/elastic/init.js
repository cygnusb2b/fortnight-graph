const Promise = require('bluebird');
const models = require('./models');

const emitMap = (index, type) => process.stdout.write(`ElasticSearch mappings for '${index}/${type}' successfully set.\n`);
const emitSync = (index, type) => process.stdout.write(`ElasticSearch populate for '${index}/${type}' complete.\n`);

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

const initialize = (elastic, recreate = false) => Promise
  .all(models.map(Model => initializeFor(Model, elastic, recreate)));

module.exports = initialize;
