const randomBetween = require('../../src/utils/random-between');

describe('utils/random-between', function() {
  it('should export a function.', function(done) {
    expect(randomBetween).to.be.a('function');
    done();
  });
  const cases = [
    [5, 10], [1, 2], [-10, 25], [0, 1], [10, 1000],
  ];
  cases.forEach((args) => {
    it(`should generate an integer between ${args[0]} and ${args[1]}`, function(done) {
      expect(randomBetween(...args)).to.be.within(args[0], args[1]);
      done();
    });
  });
  it('should select the exact number when min and max are the same.', function(done) {
    expect(randomBetween(1, 1)).to.equal(1);
    expect(randomBetween(0, 0)).to.equal(0);
    done();
  });
});
