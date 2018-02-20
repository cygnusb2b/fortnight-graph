const DateType = require('../../../src/graph/custom-types/date');
const { Kind } = require('graphql/language');

describe('graph/custom-types/date', function() {
  describe('#serialize', function() {
    ['', null, undefined].forEach((value) => {
      it(`should return null when the value is '${value}'.`, function(done) {
        expect(DateType.serialize(value)).to.be.null;
        done();
      });
    });
    it('should return the serialized Date value as a timestamp.', function(done) {
      const value = new Date();
      expect(DateType.serialize(value)).to.equal(value.getTime());
      done();
    });
  });
  describe('#parseValue', function() {
    ['', null].forEach((value) => {
      it(`should return null when the value is '${value}'.`, function(done) {
        expect(DateType.parseValue(value)).to.be.null;
        done();
      });
    });
    it('should return the serialized Date value.', function(done) {
      const value = DateType.parseValue(1519156394000);
      expect(value).to.be.instanceOf(Date);
      expect(value.getTime()).to.equal(1519156394000);
      done();
    });
    it('should return when stringified.', function(done) {
      const value = DateType.parseValue('1519156394000');
      expect(value).to.be.instanceOf(Date);
      expect(value.getTime()).to.equal(1519156394000);
      done();
    });
  });
  describe('#parseLiteral', function() {
    it('should return null when type is not an int.', function(done) {
      expect(DateType.parseLiteral({ kind: null })).to.be.null;
      done();
    });
    it('should return the serialized literal, integer value.', function(done) {
      expect(DateType.parseLiteral({ kind: Kind.INT, value: '1519156394000' })).to.equal(1519156394000);
      expect(DateType.parseLiteral({ kind: Kind.INT, value: 1519156394000 })).to.equal(1519156394000);
      expect(DateType.parseLiteral({ kind: Kind.INT, value: 1519156394000.1 })).to.equal(1519156394000);
      done();
    });
  });
});
