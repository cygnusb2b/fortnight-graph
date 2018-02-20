const { CursorType } = require('../../../src/graph/custom-types/cursor');
const { Kind } = require('graphql/language');

describe('graph/custom-types/cursor', function() {
  describe('#serialize', function() {
    ['', null, undefined].forEach((value) => {
      it(`should return null when the value is '${value}'.`, function(done) {
        expect(CursorType.serialize(value)).to.be.null;
        done();
      });
    });
    it('should return the serialized cursor value.', function(done) {
      expect(CursorType.serialize('507f1f77bcf86cd799439011')).to.equal('NTA3ZjFmNzdiY2Y4NmNkNzk5NDM5MDEx');
      done();
    });
  });
  describe('#parseValue', function() {
    ['', null, '^'].forEach((value) => {
      it(`should return null when the value is '${value}'.`, function(done) {
        expect(CursorType.parseValue(value)).to.be.null;
        done();
      });
    });
    it('should return the serialized cursor value.', function(done) {
      expect(CursorType.parseValue('NTA3ZjFmNzdiY2Y4NmNkNzk5NDM5MDEx')).to.equal('507f1f77bcf86cd799439011');
      done();
    });
  });
  describe('#parseLiteral', function() {
    it('should return null when type is not a string.', function(done) {
      expect(CursorType.parseLiteral({ kind: null })).to.be.null;
      done();
    });
    ['', '^'].forEach((value) => {
      it(`should return null when the value is '${value}'.`, function(done) {
        expect(CursorType.parseLiteral({ kind: Kind.STRING, value })).to.be.null;
        done();
      });
    });
    it('should return the serialized cursor value.', function(done) {
      expect(CursorType.parseLiteral({ kind: Kind.STRING, value: 'NTA3ZjFmNzdiY2Y4NmNkNzk5NDM5MDEx' })).to.equal('507f1f77bcf86cd799439011');
      done();
    });
  });
});
