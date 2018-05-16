module.exports = {
  entity_name: {
    type: 'custom',
    tokenizer: 'classic',
    filter: [
      'word_delimiter_preserved',
      'lowercase',
      'asciifolding',
      'apostrophe',
      'english_stop',
      'unique',
    ],
    char_filter: ['html_strip', 'remove_special_chars', 'force_dashes'],
  },
  // @todo This might not be needed if we search `entity_name` with and.
  entity_exact: {
    type: 'custom',
    tokenizer: 'keyword',
    filter: [
      'lowercase',
      'asciifolding',
    ],
    char_filter: ['html_strip'],
  },
  entity_tri_gram: {
    type: 'custom',
    tokenizer: 'classic',
    filter: [
      'word_delimiter_concatenated',
      'lowercase',
      'asciifolding',
      'english_stop',
      'tri_grams',
      'unique',
    ],
    char_filter: ['html_strip', 'remove_special_chars', 'force_dashes'],
  },
  entity_starts_with: {
    type: 'custom',
    tokenizer: 'classic',
    filter: [
      'word_delimiter_preserved',
      'lowercase',
      'asciifolding',
      'starts_with',
    ],
    char_filter: ['html_strip', 'remove_special_chars', 'force_dashes'],
  },
  // This should be searched using the and operator.
  // @see https://www.elastic.co/guide/en/elasticsearch/reference/current/analysis-edgengram-tokenizer.html
  entity_starts_with_search: {
    type: 'custom',
    tokenizer: 'classic',
    filter: [
      'word_delimiter_preserved',
      'lowercase',
      'asciifolding',
    ],
    char_filter: ['html_strip', 'remove_special_chars', 'force_dashes'],
  },
};
