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
  /**
   * The `search` static method.
   */
  schema.static('search', function search(phrase, {
    pagination,
    postFilter,
    filter,
    must,
    mustNot,
    minMatch,
  } = {}) {
    const query = buildEntityNameQuery(phrase, fieldNames, {
      filter,
      must,
      mustNot,
      minMatch,
    });
    if (typeof beforeSearch === 'function') beforeSearch(query, phrase);
    return paginateSearch(this, phrase, query, { pagination, postFilter });
  });

  /**
   * The `autocomplete` static method.
   */
  schema.static('autocomplete', function autocomplete(phrase, {
    pagination,
    postFilter,
    filter,
    must,
    mustNot,
    minMatch,
  } = {}) {
    const query = buildEntityAutocomplete(phrase, fieldNames, {
      filter,
      must,
      mustNot,
      minMatch,
    });
    if (typeof beforeAutocomplete === 'function') beforeAutocomplete(query, phrase);
    return paginateSearch(this, phrase, query, { pagination, postFilter });
  });
};
