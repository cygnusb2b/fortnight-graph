const Generate = require('../../../src/fixtures/generators/advertiser');

describe('fixtures/generators/advertiser', function() {
  it('should return a factory function', function(done) {
    expect(Generate).to.be.a('function');
    done();
  });

  const fields = [
    { key: 'name', cb: v => expect(v).be.a('string') },
    { key: 'logo', cb: v => expect(v).to.be.a('string') },
    { key: 'createdAt', cb: v => expect(v).be.a('date') },
    { key: 'updatedAt', cb: v => expect(v).be.a('date') },
    { key: 'notify', cb: v => expect(v).to.be.an('object') },
  ];


  const internalContactIds = ['1234'];
  const externalContactIds = ['5678'];
  const obj = Generate({ internalContactIds, externalContactIds });

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
