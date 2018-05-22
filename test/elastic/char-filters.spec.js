const charFilters = require('../../src/elastic/char-filters');

describe('elastic/char-filters', function() {
  it('should return an object with the correct properties', function(done) {
    expect(charFilters).to.be.an('object').with.keys(['remove_special_chars', 'force_dashes', 'strip_dashes']);
    done();
  });
});
