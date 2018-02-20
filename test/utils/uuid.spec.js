const uuidUtil = require('../../src/utils/uuid');

const cases = [
  { value: '', expected: null, valid: false },
  { value: false, expected: null, valid: false },
  { value: 0, expected: null, valid: false },
  { value: undefined, expected: null, valid: false },
  { value: null, expected: null, valid: false },
  { value: '1234', expected: '1234', valid: false },
  { value: ' 1234 ', expected: '1234', valid: false },
  { value: ' 1-2-34-- ', expected: '1234', valid: false },
  { value: ' 1-2-34-ab-CD ', expected: '1234abcd', valid: false },
  { value: 'de86645a-c3df-456a-9c65-3266da2880f4', expected: 'de86645ac3df456a9c653266da2880f4', valid: true },
  { value: 'de86645ac3df456a9c653266da2880f4', expected: 'de86645ac3df456a9c653266da2880f4', valid: true },
  { value: 'de86645a-c3df456a9c653266da2880f4 dE86645ac3df456a9c653266da2880f4', expected: 'de86645ac3df456a9c653266da2880f4 de86645ac3df456a9c653266da2880f4', valid: false },
  { value: '  dE8-6645-ac3df456a9c-6532-66dA2-880f4  ', expected: 'de86645ac3df456a9c653266da2880f4', valid: true },
];

describe('utils/uuid', function() {
  it('should export an object and respond to methods.', function(done) {
    expect(uuidUtil).to.be.an('object');
    expect(uuidUtil).to.respondTo('normalize');
    expect(uuidUtil).to.respondTo('is');
    done();
  });
  describe('#normalize', function() {
    cases.filter(item => item.expected === null).forEach((item) => {
      it(`should return 'null' when the value is '${item.value}'`, function(done) {
        expect(uuidUtil.normalize(item.value)).to.be.null;
        done();
      });
    });
    cases.filter(item => item.expected !== null).forEach((item) => {
      it(`should return '${item.expected}' when the value is '${item.value}'`, function(done) {
        expect(uuidUtil.normalize(item.value)).to.equal(item.expected);
        done();
      });
    });
  });
  describe('#is', function() {
    cases.filter(item => item.valid === false).forEach((item) => {
      it(`should return 'false' when the value is '${item.value}'`, function(done) {
        expect(uuidUtil.is(item.value)).to.be.false;
        done();
      });
    });
    cases.filter(item => item.valid === true).forEach((item) => {
      it(`should return 'true' when the value is '${item.value}'`, function(done) {
        expect(uuidUtil.is(item.value)).to.be.true;
        done();
      });
    });
  });
});
