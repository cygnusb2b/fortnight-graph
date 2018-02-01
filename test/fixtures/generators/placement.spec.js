const expect = require('chai').expect;
const Generate = require('../../../src/fixtures/generators/placement');

describe('fixtures/generators/placement', function() {
  it('should return a factory function', function(done) {
    expect(Generate).to.be.a('function');
    done();
  });
  it('should throw a type error when a publisher function is not provided', function(done) {
    expect(Generate).to.throw(TypeError)
    done();
  });
  it('should return a generated object.', function(done) {
    const publisherId = () => '1234';
    const obj = Generate({ publisherId });
    expect(obj).to.be.an('object');
    expect(obj).to.have.keys(['name', 'pid', 'template', 'createdAt', 'updatedAt', 'publisherId']);
    expect(obj).to.have.property('name').and.be.a('string');
    expect(obj).to.have.property('pid').and.be.a('string');
    expect(obj).to.have.property('template').and.be.a('string');
    expect(obj).to.have.property('createdAt').and.be.a('number').gt(0);
    expect(obj).to.have.property('updatedAt').and.be.a('number').gt(0);
    expect(obj).to.have.property('publisherId').and.equal('1234');
    done();
  });
});
