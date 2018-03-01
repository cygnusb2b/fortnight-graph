const isScalar = require('../../src/utils/is-scalar');

describe('utils/is-scalar', function() {
  it('should export a function.', function(done) {
    expect(isScalar).to.be.a('function');
    done();
  });
  it('should return true for null and undefined.', function(done){
    [undefined, null].forEach((value) => {
      expect(isScalar(value)).to.be.true;
    });
    done();
  });
  it('should return true for stings.', function(done){
    ['', new String('foo'), String('bar')].forEach((value) => {
      expect(isScalar(value)).to.be.true;
    });
    done();
  });
  it('should return true for numbers.', function(done){
    [1, -1, 1.1, NaN, new Number('12')].forEach((value) => {
      expect(isScalar(value)).to.be.true;
    });
    done();
  });
  it('should return true for booleans.', function(done){
    [true, false, new Boolean(1)].forEach((value) => {
      expect(isScalar(value)).to.be.true;
    });
    done();
  });
  it('should return true for symbols.', function(done){
    [Symbol(1)].forEach((value) => {
      expect(isScalar(value)).to.be.true;
    });
    done();
  });
  it('should return false for objects and arrays.', function(done){
    [{}, [], () => {}].forEach((value) => {
      expect(isScalar(value)).to.be.false;
    });
    done();
  });

});
