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

  schema.static('findByIdWherePresent', function findByIdWherePresent(id) {
    return this.findOne({ _id: id || null, deleted: false });
  });

  schema.static('findOneWherePresent', function findOneWherePresent(criteria) {
    return this.findOne({ ...criteria, deleted: false });
  });
};
