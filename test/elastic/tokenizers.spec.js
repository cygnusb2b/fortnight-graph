const tokenizers = require('../../src/elastic/tokenizers');

describe('elastic/tokenizers', function() {
  it('should return an object with the correct properties', function(done) {
    expect(tokenizers).to.be.an('object').with.keys([
      'starts_with',
    ]);
    done();
  });
});
