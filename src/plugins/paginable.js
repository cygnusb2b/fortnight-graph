const { Pagination } = require('@limit0/mongoose-graphql-pagination');

module.exports = function paginablePlugin(schema) {
  // eslint-disable-next-line no-param-reassign
  schema.statics.paginate = function paginate({ criteria, pagination, sort } = {}) {
    return new Pagination(this, { criteria, pagination, sort });
  };
};
