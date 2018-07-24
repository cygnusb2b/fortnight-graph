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
  schema.static('search', function search(phrase, { pagination, postFilter } = {}) {
    const query = buildEntityNameQuery(phrase, fieldNames);
    if (typeof beforeSearch === 'function') beforeSearch(query, phrase);
    return paginateSearch(this, phrase, query, { pagination, postFilter });
  });

  schema.static('autocomplete', function autocomplete(phrase, { pagination, postFilter } = {}) {
    const query = buildEntityAutocomplete(phrase, fieldNames);
    if (typeof beforeAutocomplete === 'function') beforeAutocomplete(query, phrase);
    return paginateSearch(this, phrase, query, { pagination, postFilter });
  });
};
