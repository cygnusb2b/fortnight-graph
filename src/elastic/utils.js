const Pagination = require('../classes/pagination');
const SearchPagination = require('../classes/elastic/pagination');
const { client } = require('./index');

const entityNameDefinitions = {
  exact: {
    suffix: 'exact', props: { boost: 10 },
  },
  root: {
    suffix: null, props: { operator: 'and', boost: 5 },
  },
  phonetic: {
    suffix: 'phonetic', props: { boost: 3 },
  },
  edgeAnd: {
    suffix: 'edge', props: { operator: 'and', boost: 2 },
  },
  edgeOr: {
    suffix: 'edge', props: { boost: 1 },
  },
  ngramAnd: {
    suffix: 'ngram', props: { operator: 'and', boost: 0.5 },
  },
  ngramOr: {
    suffix: 'ngram', props: {},
  },
};

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

  buildEntityNameQuery(query, fieldName = 'name') {
    const should = [];
    Object.keys(entityNameDefinitions).forEach((name) => {
      const def = entityNameDefinitions[name];

      const { suffix, props } = def;
      props.query = query;

      const field = suffix ? `${fieldName}.${suffix}` : fieldName;
      should.push({ match: { [field]: props } });
    });
    return { bool: { should } };
  },

  buildMultipleEntityNameQuery(query, fieldNames) {
    const should = [];
    Object.keys(entityNameDefinitions).forEach((name) => {
      const def = entityNameDefinitions[name];
      const { suffix, props } = def;
      const match = {
        ...props,
        query,
        type: 'cross_fields',
        fields: fieldNames.map(field => (suffix ? `${field}.${suffix}` : field)),
      };
      should.push({ multi_match: match });
    });
    console.dir(should, { depth: 5 });
    return { bool: { should } };
  },

  buildEntityAutocomplete(query) {
    return {
      bool: {
        should: [
          { match: { 'name.edge': { query, operator: 'and', boost: 2 } } },
          { match: { 'name.edge': { query } } },
        ],
      },
    };
  },
};
