const escapeRegex = require('escape-string-regexp');
const deepAssign = require('deep-assign');

class TypeAhead {
  static getCriteria(typeahead = {}, criteria = {}, position) {
    const { field, term } = typeahead;
    if (!term) throw new Error('TypeAhead term must be specified.');
    const escaped = TypeAhead.buildRegexQuery(term, position);
    return {
      criteria: deepAssign({ [field]: escaped }, criteria),
      sort: { [field]: 1 },
    };
  }

  static buildRegexQuery(term = '', position) {
    // Be default, if no position is sent, the `contains` type is used.
    let start = '';
    let end = '';
    if (position === 'startsWith') {
      start = '^';
    } else if (position === 'endsWith') {
      end = '$';
    } else if (position === 'exact') {
      start = '^';
      end = '$';
    }
    return new RegExp(`${start}${escapeRegex(term)}${end}`, 'i');
  }
}

module.exports = TypeAhead;
