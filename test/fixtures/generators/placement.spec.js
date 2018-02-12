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

  const fields = [
    { key: 'name', cb: v => expect(v).be.a('string') },
    { key: 'template', cb: v => expect(v).be.a('string') },
    { key: 'createdAt', cb: v => expect(v).be.a('date') },
    { key: 'updatedAt', cb: v => expect(v).be.a('date') },
    { key: 'publisherId', cb: v => expect(v).to.equal('1234') },
  ];

  const publisherId = () => '1234';
  const obj = Generate({ publisherId });

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
