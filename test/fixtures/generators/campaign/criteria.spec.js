const Generate = require('../../../../src/fixtures/generators/campaign/criteria');

describe('fixtures/generators/campaign/criteria', function() {
  it('should return a factory function', function(done) {
    expect(Generate).to.be.a('function');
    done();
  });
  const fields = [
    { key: 'start', cb: v => expect(v).be.a('date') },
    { key: 'end', cb: v => expect(v).be.a('date') },
    { key: 'placements', cb: v => expect(v).be.an('array') },
    { key: 'kvs', cb: v => expect(v).be.an('array') },
  ];

  const placementId = () => '2345';
  const obj = Generate({ placementId });

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
