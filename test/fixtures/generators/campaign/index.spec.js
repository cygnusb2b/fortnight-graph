const expect = require('chai').expect;
const Generate = require('../../../../src/fixtures/generators/campaign');
const GenCreative = require('../../../../src/fixtures/generators/campaign/creative')

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

  const creative = GenCreative();
  const fields = [
    { key: 'name', cb: v => expect(v).be.a('string') },
    { key: 'cid', cb: v => expect(v).be.a('string') },
    { key: 'advertiserId', cb: v => expect(v).to.equal('1234') },
    { key: 'creatives', cb: v => expect(v).be.an('array').that.contains(creative) },
    { key: 'status', cb: v => expect(v).be.a('string').and.be.oneOf([
      'Active',
      'Paused',
      'Draft',
      'Deleted',
    ]) },
    { key: 'createdAt', cb: v => expect(v).be.a('number').gt(0) },
    { key: 'updatedAt', cb: v => expect(v).be.a('number').gt(0) },
  ];

  const advertiserId = () => '1234';
  const creatives = () => [creative];
  const obj = Generate({ advertiserId, creatives });

  it('should be an object', function(done) {
    expect(obj).to.be.an('object');
    done();
  });
  it('should only contain valid field keys.', function(done) {
    const keys = fields.map(field => field.key);
    expect(obj).to.have.keys(keys);
    done();
  });
  fields.forEach((field) => {
    it(`should only have the ${field.key} property of the appropriate type.`, function(done) {
      expect(obj).to.have.property(field.key);
      field.cb(obj[field.key]);
      done();
    });
  });
});