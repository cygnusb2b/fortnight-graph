const filters = require('../../src/elastic/filters');

describe('elastic/filters', function() {
  it('should return an object with the correct properties', function(done) {
    expect(filters).to.be.an('object').with.keys([
      'english_stop',
      'sounds_like',
      'tri_grams',
      'starts_with',
      'word_delimiter_concatenated',
      'word_delimiter_preserved',
    ]);
    done();
  });
});
