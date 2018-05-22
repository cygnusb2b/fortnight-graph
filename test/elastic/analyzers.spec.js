const analyzers = require('../../src/elastic/analyzers');

describe('elastic/analyzers', function() {
  it('should return an object with the correct properties', function(done) {
    expect(analyzers).to.be.an('object').with.keys([
      'email_address',
      'email_address_starts_with',
      'entity_exact',
      'entity_name',
      'entity_sounds_like',
      'entity_starts_with',
      'entity_starts_with_search',
      'entity_tri_gram',
    ]);
    done();
  });
});
