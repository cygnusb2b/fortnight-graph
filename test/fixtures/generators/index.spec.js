const generators = require('../../../src/fixtures/generators');

describe('fixtures/generators', function() {
  it('should return an object.', function(done) {
    expect(generators).to.be.an('object');
    done();
  });
  const cases = [
    'publisher', 'placement', 'advertiser', 'campaign', 'creative', 'user', 'template'
  ];
  it(`should only contain the ${cases.join(', ')} properties`, function(done) {
    expect(generators).to.have.keys(cases);
    done();
  });
  cases.forEach((name) => {
    it(`should contain the '${name}' generator function.`, function(done) {
      expect(generators).to.have.property(name).and.be.a('function');
      done();
    });
  });
});
