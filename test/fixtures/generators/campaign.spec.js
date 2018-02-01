const expect = require('chai').expect;
const Generate = require('../../../src/fixtures/generators/campaign');

describe('fixtures/generators/campaign', function() {
  it('should return a factory function', function(done) {
    expect(Generate).to.be.a('function');
    done();
  });
  it('should throw a type error when an advertiser function is not provided', function(done) {
    expect(Generate).to.throw(TypeError)
    done();
  });
  it('should return a generated object.', function(done) {
    const advertiserId = () => '1234';
    const obj = Generate({ advertiserId });
    expect(obj).to.be.an('object');
    expect(obj).to.have.keys(['name', 'cid', 'advertiserId', 'status', 'createdAt', 'updatedAt']);
    expect(obj).to.have.property('name').and.be.a('string');
    expect(obj).to.have.property('cid').and.be.a('string');
    expect(obj).to.have.property('advertiserId').and.equal('1234');
    expect(obj).to.have.property('status').and.be.a('string').and.be.oneOf([
      'Active',
      'Paused',
      'Draft',
      'Deleted',
    ]);
    expect(obj).to.have.property('createdAt').and.be.a('number').gt(0);
    expect(obj).to.have.property('updatedAt').and.be.a('number').gt(0);

    done();
  });
});
