const cleanValues = require('../../src/utils/clean-values');

describe('utils/clean-values', function() {
  it('should export a function.', function(done) {
    expect(cleanValues).to.be.a('function');
    done();
  });

  [undefined, {}, null, '', []].forEach((kv) => {
    it(`should return an empty object when the kv is '${kv}'`, function (done) {
      expect(cleanValues(kv)).to.deep.equal({});
      done();
    });
  });
  it(`should strip empty and non-scalar values.`, function (done) {
    const kv = { bad: '', another: null, final: undefined, obj: {}, arr: [] };
    expect(cleanValues(kv)).to.deep.equal({});
    done();
  });
  it(`should coerce non-strings to strings.`, function (done) {
    const kv = { a: 'string', b: 0, c: false, d: 1.1, e: null, f: undefined, g: '' };
    expect(cleanValues(kv)).to.deep.equal({ a: 'string', b: '0', c: 'false', d: '1.1' });
    done();
  });
  it(`should trim the coerced values.`, function (done) {
    const kv = { a: 'string ', b: ' string ' };
    expect(cleanValues(kv)).to.deep.equal({ a: 'string', b: 'string' });
    done();
  });
  it(`after trimming, it should not keep empty strings.`, function (done) {
    const kv = { a: ' ', b: '     ' };
    expect(cleanValues(kv)).to.deep.equal({});
    done();
  });
});
