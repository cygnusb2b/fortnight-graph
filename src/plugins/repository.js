/* eslint-disable no-param-reassign */
module.exports = function repositoryPlugin(schema) {
  schema.statics.findAndSetUpdate = async function findAndSetUpdate(id, payload) {
    const doc = await this.findById(id);
    if (!doc) throw new Error(`Unable to update ${this.modelName}: no record was found for ID '${id}'`);
    return doc.setUpdate(payload);
  };

  schema.methods.setUpdate = async function setUpdate(payload) {
    this.set(payload);
    return this.save();
  };

  schema.statics.findAndAssignUpdate = async function findAndAssignUpdate(id, payload) {
    const doc = await this.findById(id);
    if (!doc) throw new Error(`Unable to update ${this.modelName}: no record was found for ID '${id}'`);
    return doc.assignUpdate(payload);
  };

  schema.methods.assignUpdate = async function assignUpdate(payload) {
    Object.keys(payload).forEach((key) => {
      const value = payload[key];
      if (typeof value !== 'undefined') {
        this.set(key, value === null ? undefined : value);
      }
    });
    return this.save();
  };
};
