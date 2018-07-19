require('../connections');
const bcrypt = require('bcrypt');
const User = require('../../src/models/user');
const fixtures = require('../../src/fixtures');
const { testTrimmedField, testUniqueField, testRequiredField, stubHash } = require('../utils');

const bcryptRegex = /^\$2[ayb]\$[0-9]{2}\$[A-Za-z0-9\.\/]{53}$/;
const generateUser = () => fixtures(User, 1).one();

describe('schema/user', function() {
  let stub;
  before(function() {
    stub = stubHash();
    return User.remove();
  });
  after(function() {
    stub.restore();
    return User.remove();
  });
  it('should successfully save.', async function() {
    const user = generateUser();
    await expect(user.save()).to.be.fulfilled;
  });

  describe('#email', function() {
    let user;
    beforeEach(function() {
      user = generateUser();
    });
    it('should be trimmed.', function() {
      return testTrimmedField(User, user, 'email', { value: ' foo@bar.com  ', expected: 'foo@bar.com' });
    });
    const values = ['', null, undefined];
    values.forEach((value) => {
      it(`should be required and be rejected when the value is '${value}'`, function() {
        return testRequiredField(User, user, 'email', value);
      });
    });
    it('should be unique.', function() {
      const another = generateUser();
      return testUniqueField(User, user, another, 'email', 'some@email.com');
    });
    it('should be lowercased', async function() {
      user.set('email', 'Foo@Bar.net');
      await expect(user.save()).to.be.fulfilled;
      await expect(User.findOne({ _id: user.id })).to.eventually.have.property('email').equal('foo@bar.net');
    });

    ['some val', 'some@val', 'some@@email.net', '@yahoo.com'].forEach((value) => {
      it(`should be a valid email address and be rejected when the value is '${value}'`, async function() {
        user.set('email', value);
        await expect(user.save()).to.be.rejectedWith(Error, /invalid email address/i);
      });
    });
  });

  describe('#givenName', function() {
    let user;
    beforeEach(function() {
      user = generateUser();
    });
    it('should be trimmed.', function() {
      return testTrimmedField(User, user, 'givenName');
    });
    ['', null, undefined].forEach((value) => {
      it(`should be required and be rejected when the value is '${value}'`, function() {
        return testRequiredField(User, user, 'givenName', value);
      });
    });
  });

  describe('#familyName', function() {
    let user;
    beforeEach(function() {
      user = generateUser();
    });
    it('should be trimmed.', function() {
      return testTrimmedField(User, user, 'familyName');
    });
    ['', null, undefined].forEach((value) => {
      it(`should be required and be rejected when the value is '${value}'`, function() {
        return testRequiredField(User, user, 'familyName', value);
      });
    });
  });

  describe('#password', function() {
    let user;
    beforeEach(function() {
      user = generateUser();
    });
    it('should require a min length of 6.', async function() {
      user.set('password', '12345');
      await expect(user.save()).to.be.rejectedWith(Error, /shorter than the minimum allowed length/i);
    });
    it('should properly encode a valid password.', async function() {
      user.set('password', '123456');
      await expect(user.save()).to.be.fulfilled;
      await expect(User.findOne({ _id: user.id })).to.eventually.have.property('password').that.matches(bcryptRegex);
    });
    it('should properly update a valid password.', async function() {
      // Restore the hashing, so this test will run as expected.
      user.set('password', '123456');
      await expect(user.save()).to.be.fulfilled;
      const old = user.get('password');
      expect(old).to.match(bcryptRegex);
      user.set('password', '654321');
      await expect(user.save()).to.be.fulfilled;
      await expect(User.findOne({ _id: user.id })).to.eventually.have.property('password').that.matches(bcryptRegex);
    });
    it('should not update the password if not modified.', async function() {
      await user.save();
      const password = user.get('password');
      await expect(user.save()).to.be.fulfilled.and.eventually.have.property('password', password);
    });
  });

  describe('#role', function() {
    let user;
    beforeEach(function() {
      user = generateUser();
    });

    [null, undefined].forEach((value) => {
      it(`should be required and be rejected when the value is '${value}'`, function() {
        return testRequiredField(User, user, 'role', value);
      });
    });
    const allowed = ['Member', 'Admin'];
    allowed.forEach((value) => {
      it(`should be fulfilled when the enum value is '${value}'`, async function() {
        user.set('role', value);
        await expect(user.save()).to.be.fulfilled;
      });
    });
    it('should reject when the value is not in the enum list.', async function() {
      user.set('role', 'admin');
      await expect(user.save()).to.be.rejectedWith(Error, /is not a valid enum value/);
    });
  });

  describe('#photoURL', function() {
    let user;
    beforeEach(function() {
      user = generateUser();
    });

    it('should be trimmed.', function() {
      return testTrimmedField(User, user, 'photoURL', { value: ' http://somedomain.com  ', expected: 'http://somedomain.com' });
    });

    ['ftp://somedomain.com', 'some value', 'http://', 'http://foo', 'www.somedomain.com'].forEach((value) => {
      it(`should be required and be rejected when the value is '${value}'`, async function() {
        user.set('photoURL', value);
        await expect(user.save()).to.be.rejectedWith(Error, /Invalid photo URL/);
      });
    });
    it('should set a default gravatar URL when empty.', async function() {
      user.set('photoURL', '');
      await expect(user.save()).to.be.fulfilled.and.eventually.have.property('photoURL').that.matches(/gravatar/i);
    });
  });

});
