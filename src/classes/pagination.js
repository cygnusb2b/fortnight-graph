const deepAssign = require('deep-assign');
const { CursorType } = require('../graph/custom-types');

const { assign, keys } = Object;

class Pagination {
  constructor(Model, { criteria = {}, pagination = {}, sort = {} } = {}) {
    this.Model = Model;

    // Additional, root level query criteria.
    this.criteria = deepAssign({}, criteria);

    const { first, after } = assign({}, pagination);
    this.first = first;
    this.after = after;

    this.sort = Pagination.parseSort(assign({}, sort));
    this.collation = { locale: 'en_US' };
  }

  async findCursorModel(id, fields) {
    const model = await this.Model.findOne({ _id: id })
      .select(fields)
      .comment(this.createComment('findCursorModel'));
    if (!model) throw new Error(`No record found for cursor '${CursorType.serialize(id)}'.`);
    return model;
  }

  async getFilter() {
    if (this.filter) return this.filter;

    const { field, order } = this.sort;

    const filter = deepAssign({}, this.criteria);
    const limits = {};
    const ors = [];

    if (this.after) {
      let model;
      const op = order === 1 ? '$gt' : '$lt';
      if (field === '_id') {
        // Sort by ID only.
        model = await this.findCursorModel(this.after, { _id: 1 });
        filter._id = { [op]: model.id };
      } else {
        model = await this.findCursorModel(this.after, { [field]: 1 });
        limits[op] = model[field];
        ors.push({
          [field]: model[field],
          _id: { [op]: model.id },
        });
        filter.$or = [{ [field]: limits }, ...ors];
      }
    }
    this.filter = filter;
    return this.filter;
  }

  async getEdges() {
    const filter = await this.getFilter();
    return this.Model.find(filter)
      .sort(this.getSortObject())
      .limit(this.limit)
      .collation(this.collation)
      .comment(this.createComment('getEdges'));
  }

  getTotalCount() {
    return this.Model.find().comment(this.createComment('getTotalCount')).count();
  }

  async getEndCursor() {
    const filter = await this.getFilter();

    const Query = this.Model
      .findOne(filter)
      .sort(this.getSortObject())
      .limit(this.limit)
      .skip(this.limit - 1)
      .select({ _id: 1 })
      .collation(this.collation)
      .comment(this.createComment('getEndCursor'));

    const model = await Query;
    return model ? model.get('id') : null;
  }

  async hasNextPage() {
    const filter = await this.getFilter();
    const count = await this.Model.find(filter)
      .sort(this.getSortObject())
      .collation(this.collation)
      .comment(this.createComment('hasNextPage'))
      .count();
    return Boolean(count > this.limit);
  }

  static parseSort({ field, order } = {}) {
    return {
      field: Pagination.getSortField(field),
      order: Pagination.getSortOrder(order),
    };
  }

  static getSortField(field) {
    const toResolve = field || 'id';
    const resolveToId = ['id', '_id', 'createdAt'];
    return toResolve && !resolveToId.includes(toResolve) ? toResolve : '_id';
  }

  static getSortOrder(order) {
    return parseInt(order, 10) === -1 ? -1 : 1;
  }

  getSortObject() {
    const { field, order } = this.sort;
    const obj = { [field]: order };
    if (field !== '_id') obj._id = order;
    return obj;
  }

  invertSortObj() {
    const sort = this.getSortObject();
    return keys(sort).reduce((obj, key) => assign(obj, { [key]: sort[key] === 1 ? -1 : 1 }), {});
  }

  get limit() {
    const def = 10;
    const max = 200;
    const limit = parseInt(this.first, 10);
    if (!limit || limit < 1) return def;
    if (limit > max) return max;
    return limit;
  }

  createComment(method) {
    return `Pagination: ${this.Model.modelName} - ${method}`;
  }
}

module.exports = Pagination;
