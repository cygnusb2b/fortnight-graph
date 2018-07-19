const {
  buildEntityNameQuery,
  buildEntityAutocomplete,
  paginateSearch,
} = require('../elastic/utils');

module.exports = function searchablePlugin(schema, {
  fieldNames = [],
  beforeSearch,
  beforeAutocomplete,
} = {}) {
  // eslint-disable-next-line no-param-reassign
  schema.statics.search = function search(phrase, { pagination } = {}) {
    const query = buildEntityNameQuery(phrase, fieldNames);
    if (typeof beforeSearch === 'function') beforeSearch(query, phrase);
    return paginateSearch(this, phrase, query, { pagination });
  };

  // eslint-disable-next-line no-param-reassign
  schema.statics.autocomplete = function autocomplete(phrase, { pagination } = {}) {
    const query = buildEntityAutocomplete(phrase, fieldNames);
    if (typeof beforeAutocomplete === 'function') beforeAutocomplete(query, phrase);
    return paginateSearch(this, phrase, query, { pagination });
  };
};
