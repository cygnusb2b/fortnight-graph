const Pagination = require('../classes/pagination');
const SearchPagination = require('../classes/elastic/pagination');
const { client } = require('./index');

module.exports = {
  /**
   *
   * @param {*} Model
   * @param {*} phrase
   * @param {*} query
   * @param {*} params
   */
  paginateSearch(Model, phrase, query, { pagination }) {
    if (/[a-f0-9]{24}/.test(phrase)) {
      const criteria = { _id: phrase };
      return new Pagination(Model, { pagination, criteria });
    }
    const { index, type } = Model.esOptions();
    const params = {
      index,
      type,
      body: { query },
      searchType: 'dfs_query_then_fetch',
    };
    return new SearchPagination(Model, client, { params, pagination });
  },

  buildEntityNameQuery(query) {
    return {
      bool: {
        should: [
          { match: { 'name.exact': { query, boost: 10 } } },
          { match: { name: { query, operator: 'and', boost: 5 } } },
          { match: { 'name.phonetic': { query, boost: 3 } } },
          { match: { 'name.edge': { query, operator: 'and', boost: 2 } } },
          { match: { 'name.edge': { query, boost: 1 } } },
          { match: { 'name.ngram': { query, operator: 'and', boost: 0.5 } } },
          { match: { 'name.ngram': { query } } },
        ],
      },
    };
  },
};
