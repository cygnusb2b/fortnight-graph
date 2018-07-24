module.exports = function deleteablePlugin(schema, options = {}) {
  schema.add({
    deleted: {
      type: Boolean,
      required: true,
      default: false,
      ...options,
    },
  });
  schema.index({ deleted: 1 });

  schema.method('softDelete', function softDelete() {
    this.deleted = true;
    return this.save();
  });

  schema.method('undelete', function undelete() {
    this.deleted = false;
    return this.save();
  });

  schema.static('strictFindActiveById', async function strictFindActiveById(id, fields) {
    const doc = await this.findActiveById(id, fields);
    if (!doc) throw new Error(`No ${this.modelName} found for ID '${id}'`);
    return doc;
  });

  schema.static('findActiveById', function findActiveById(id, fields) {
    return this.findOne({ _id: id || null, deleted: false }, fields);
  });

  schema.static('strictFindActiveOne', async function strictFindActiveOne(criteria, fields) {
    const doc = await this.findActiveOne(criteria, fields);
    if (!doc) throw new Error(`No ${this.modelName} found for criteria '${JSON.stringify(criteria)}'`);
    return doc;
  });

  schema.static('findActiveOne', function findActiveOne(criteria, fields) {
    return this.findOne({ ...criteria, deleted: false }, fields);
  });
};
