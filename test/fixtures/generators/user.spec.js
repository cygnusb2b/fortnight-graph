const Generate = require('../../../src/fixtures/generators/user');

describe('fixtures/generators/user', function() {
  it('should return a factory function', function(done) {
    expect(Generate).to.be.a('function');
    done();
  });
  const fields = [
    { key: 'email', cb: v => expect(v).be.a('string') },
    { key: 'password', cb: v => expect(v).be.a('string') },
    { key: 'givenName', cb: v => expect(v).be.a('string') },
    { key: 'familyName', cb: v => expect(v).be.a('string') },
    { key: 'logins', cb: v => expect(v).be.a('number') },
    { key: 'lastLoggedInAt', cb: v => expect(v).be.a('date') },
    { key: 'isEmailVerified', cb: v => expect(v).be.a('boolean') },
    { key: 'role', cb: v => expect(v).be.a('string') },
    { key: 'photoURL', cb: v => expect(v).be.a('string') },
    { key: 'createdAt', cb: v => expect(v).be.a('date') },
    { key: 'updatedAt', cb: v => expect(v).be.a('date') },
  ];
  const obj = Generate();

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
