const deepAssign = require('deep-assign');
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

  async getFilter() {
    if (this.filter) return this.filter;

    const { field, order } = this.sort;

    const filter = deepAssign({}, this.criteria);
    const limits = {};
    const ors = [];

    if (this.after) {
      const op = order === 1 ? '$gt' : '$lt';
      if (field === '_id') {
        // Sort by ID only.
        filter._id = { [op]: this.after };
      } else {
        const model = await this.Model.findOne({ _id: this.after })
          .select({ [field]: 1 })
          .comment(this.createComment('getFilter'));
        if (!model) throw new Error('No record found for the provided `after` cursor.');
        limits[op] = model[field];
        ors.push({
          [field]: model[field],
          _id: { [op]: this.after },
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
      .limit(this.getLimit())
      .collation(this.collation)
      .comment(this.createComment('getEdges'));
  }

  getTotalCount() {
    return this.Model.find().comment(this.createComment('getTotalCount')).count();
  }

  async getEndCursor() {
    const filter = await this.getFilter();
    const limit = this.getLimit();

    const Query = this.Model
      .findOne(filter)
      .select({ _id: 1 })
      .collation(this.collation)
      .comment(this.createComment('getEndCursor'));

    if (limit) {
      const skip = limit - 1;
      Query.sort(this.getSortObject()).limit(limit).skip(skip);
    } else {
      Query.sort(this.invertSortObj()).limit(1);
    }
    const model = await Query;
    return model ? model.get('id') : null;
  }

  async hasNextPage() {
    let count;
    const limit = this.getLimit();

    if (limit) {
      const filter = await this.getFilter();
      count = await this.Model.find(filter)
        .sort(this.getSortObject())
        .collation(this.collation)
        .comment(this.createComment('hasNextPage'))
        .count();
    }
    return Boolean(limit && count > limit);
  }

  static parseSort({ field, order } = {}) {
    return {
      field: Pagination.getSortField(field),
      order: Pagination.getSortOrder(order),
    };
  }

  static getSortField(field) {
    const resolveToId = ['id', '_id', 'createdAt'];
    return field && !resolveToId.includes(field) ? field : '_id';
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

  getLimit({ def = 10, max = 200 } = {}) {
    let limit = parseInt(this.first, 10);
    if (!limit || limit < 1) {
      limit = def;
    } else if (limit > 200) {
      limit = max;
    }
    return limit;
  }

  createComment(method) {
    return `Pagination: ${this.Model.modelName} - ${method}`;
  }
}

module.exports = Pagination;
