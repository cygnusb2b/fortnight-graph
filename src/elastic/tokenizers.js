module.exports = {
  starts_with: {
    type: 'edge_ngram',
    min_gram: 1,
    max_gram: 10,
    token_chars: ['letter', 'digit'],
  },
};
