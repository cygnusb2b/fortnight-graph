const expect = require('chai').expect;
const Generate = require('../../../src/fixtures/generators/campaign');
const GenCreative = require('../../../src/fixtures/generators/creative')

describe('fixtures/generators/campaign', function() {
  it('should return a factory function', function(done) {
    expect(Generate).to.be.a('function');
    done();
  });
  it('should throw a type error when the required functions are not provided', function(done) {
    expect(Generate).to.throw(TypeError);
    const advertiserId = () => '1234';
    const creatives = () => [];

    expect(() => Generate(({ advertiserId }))).to.throw(TypeError);
    expect(() => Generate(({ creatives }))).to.throw(TypeError);
    done();
  });
  it('should return a generated object.', function(done) {
    const advertiserId = () => '1234';
    const creative = GenCreative();
    const creatives = () => [creative];
    const obj = Generate({ advertiserId, creatives });
    expect(obj).to.be.an('object');
    expect(obj).to.have.keys(['name', 'cid', 'advertiserId', 'status', 'createdAt', 'updatedAt', 'creatives']);
    expect(obj).to.have.property('name').and.be.a('string');
    expect(obj).to.have.property('cid').and.be.a('string');
    expect(obj).to.have.property('creatives').and.be.an('array').that.contains(creative);
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
