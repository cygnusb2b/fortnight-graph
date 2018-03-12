const Utils = require('../../src/utils');

describe('utils', function() {
  it('should export an object with the utilities.', function(done) {
    expect(Utils).to.be.an('object').with.all.keys('uuid', 'cleanValues', 'randomBetween', 'isScalar');
    done();
  });
});
