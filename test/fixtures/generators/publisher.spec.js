const expect = require('chai').expect;
const Generate = require('../../../src/fixtures/generators/publisher');

describe('fixtures/generators/publisher', function() {
  it('should return a factory function', function(done) {
    expect(Generate).to.be.a('function');
    done();
  });
  it('should return a generated object.', function(done) {
    const obj = Generate();
    expect(obj).to.be.an('object');
    expect(obj).to.have.property('name').and.be.a('string');
    expect(obj).to.have.property('createdAt').and.be.a('number');
    expect(obj).to.have.property('updatedAt').and.be.a('number');
    done();
  });
});
