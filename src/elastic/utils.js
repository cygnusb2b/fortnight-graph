module.exports = {
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
