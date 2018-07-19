const {
  buildEntityNameQuery,
  buildEntityAutocomplete,
  paginateSearch,
} = require('../elastic/utils');

module.exports = function searchablePlugin(schema, { fieldNames = [] } = {}) {
  // eslint-disable-next-line no-param-reassign
  schema.statics.search = function search(phrase, { pagination } = {}) {
    const query = buildEntityNameQuery(phrase, fieldNames);
    return paginateSearch(this, phrase, query, { pagination });
  };

  // eslint-disable-next-line no-param-reassign
  schema.statics.autocomplete = function autocomplete(phrase, { pagination } = {}) {
    const query = buildEntityAutocomplete(phrase, fieldNames);
    return paginateSearch(this, phrase, query, { pagination });
  };
};
