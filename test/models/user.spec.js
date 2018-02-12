const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const User = require('../../src/models/user');
const fixtures = require('../../src/fixtures');
const { testTrimmedField, testUniqueField, testRequiredField } = require('../utils');

chai.use(chaiAsPromised);
const expect = chai.expect;

const bcryptRegex = /^\$2[ayb]\$[0-9]{2}\$[A-Za-z0-9\.\/]{53}$/;
const generateUser = () => fixtures(User, 1).one();

describe('models/user', function() {
  before(function() {
    return User.remove();
  });
  after(function() {
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
      user.set('password', '123456');
      await expect(user.save()).to.be.fulfilled;
      const old = user.get('password');
      expect(old).to.match(bcryptRegex);
      user.set('password', '654321');
      await expect(user.save()).to.be.fulfilled;
      await expect(User.findOne({ _id: user.id })).to.eventually.have.property('password').that.matches(bcryptRegex).and.does.not.equal(old);
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

});
