module.exports = {
  word_delimiter_preserved: {
    type: 'word_delimiter',
    preserve_original: true,
  },
  word_delimiter_concatenated: {
    type: 'word_delimiter',
    catenate_all: true,
  },
  english_stop: {
    type: 'stop',
    stopwords: '_english_',
  },
  tri_grams: {
    type: 'ngram',
    min_gram: 3,
    max_gram: 3,
  },
  starts_with: {
    type: 'edgeNGram',
    min_gram: 1,
    max_gram: 10,
  },
  sounds_like: {
    type: 'phonetic',
  },
};
