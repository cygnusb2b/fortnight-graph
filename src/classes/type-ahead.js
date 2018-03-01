class TypeAhead {
  static getCriteria(typeahead = {}) {
    const { field, term } = typeahead;
    if (!typeahead || !field || !term) return {};
    const escaped = TypeAhead.buildRegexQuery(term);
    return {
      criteria: { [field]: escaped },
      sort: { [field]: 1 },
    };
  }

  static buildRegexQuery(term = '') {
    const escaped = `${term}`.replace(/[-[\]/{}()*+?.\\^$|]/g, '\\$&');
    return new RegExp(`^${escaped}`, 'i');
  }
}

module.exports = TypeAhead;
