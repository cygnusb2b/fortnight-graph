const TypeAhead = require('../../src/classes/type-ahead');

describe('classes/type-ahead', function() {
  describe('#getCriteria', function() {
    it('should respond to the function.', function() {
      expect(TypeAhead).itself.to.respondTo('getCriteria');
    });
    it('should error when no term is present', function(done) {
      expect(TypeAhead.getCriteria).to.throw(Error, /TypeAhead term must be specified/i);
      done();
    });
    it('should return a tuple of criteria and sort', function(done) {
      const search = { field: 'name', term: 'test' };
      const { criteria, sort } = TypeAhead.getCriteria(search);
      expect(criteria).to.be.an('object');
      expect(sort).to.be.an('object');
      done();
    });
    it('should create sort criteria based on the passed field', function(done) {
      const search = { field: 'myFieldName', term: 'test' };
      const { sort } = TypeAhead.getCriteria(search);
      expect(sort).to.be.an('object').and.include.key('myFieldName');
      done();
    });
    it('should return a RegEx criteria', function(done) {
      const search = { field: 'myFieldName', term: 'test' };
      const { criteria } = TypeAhead.getCriteria(search);
      expect(criteria).to.be.an('object').and.include.key('myFieldName');
      expect(criteria.myFieldName).to.be.an.instanceOf(RegExp);
      done();
    });
  });
  describe('#buildRegexQuery', function() {
    it('should respond to the function', function() {
      expect(TypeAhead).itself.to.respondTo('buildRegexQuery');
    });
    it('should always return a regular expression', function(done) {
      const bads = [ undefined, '', null, false, true, new Error() ];
      expect(TypeAhead.buildRegexQuery()).to.be.an.instanceOf(RegExp);
      bads.forEach(i => expect(TypeAhead.buildRegexQuery(i)).to.be.an.instanceOf(RegExp))
      done();
    });
    it('should escape expression sensitive characters.', function(done) {
      const bads = [ '-', '[', ']', '/', '{', '}', '(', ')', '*', '+', '?', '.', '\\', '^', '$', '|' ];
      bads.forEach(s => {
        const expected = new RegExp(`^\\${s}`, 'i');
        expect(TypeAhead.buildRegexQuery(s)).to.eql(expected);
      });
      done();
    });
  });
});
