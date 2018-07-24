require('../connections');
const Repo = require('../../src/repositories/user');
const Model = require('../../src/models/user');

const User = require('../../src/models/user');
const seed = require('../../src/fixtures/seed');

const { stubHash } = require('../utils');

const createUser = () => seed.users(1);

describe('repositories/user', function() {
  let stub;
  before(function() {
    stub = stubHash();
    return User.remove();
  });
  after(function() {
    stub.restore();
    return User.remove();
  });
  it('should export an object.', function(done) {
    expect(Repo).to.be.an('object');
    done();
  });

  describe('#normalizeEmail', function() {
    [null, undefined, ''].forEach((value) => {
      it(`should return an empty string when the value is '${value}'`, function(done) {
        expect(Repo.normalizeEmail(value)).to.equal('');
        done();
      });
    });

    it('should return a trimmed, lowercased value.', function(done) {
      expect(Repo.normalizeEmail(' foo@BAr.com ')).to.equal('foo@bar.com');
      done();
    });
  });

  describe('#removeByEmail', function() {
    let user;
    before(async function() {
      user = await createUser();
    });
    after(async function() {
      await Repo.remove();
    });
    [null, undefined, '', '   '].forEach((value) => {
      it(`should return a rejected promise when the email is '${value}'.`, async function() {
        await expect(Repo.removeByEmail(value)).to.be.rejectedWith(Error, 'Unable to remove user: no email address was provided.');
      });
    });
    it('remove the requested user.', async function() {
      await expect(Repo.removeByEmail(user.email)).to.be.fulfilled;
      await expect(Repo.findByEmail(user.email)).to.be.fulfilled.and.eventually.be.null;
    });
  });

  describe('#login', function() {
    let user;
    const cleartext = 'test password';
    before(async function() {
      // Unstub to simulate true behavior.
      stub.restore();
      user = await createUser();
      user.set('password', cleartext);
      await user.save();
    });
    after(async function() {
      // restub hashing
      stub = stubHash();
      await Repo.remove();
    });
    [null, undefined, '', false, 0].forEach((value) => {
      it(`should reject when the password is '${value}'.`, async function() {
        await expect(Repo.login('foo@bar.com', value)).to.be.rejectedWith(Error, 'Unable to login user. No password was provided.');
      });
    });

    it('should reject when no user was found for the provided email address.', async function() {
      await expect(Repo.login('foo@bar.com.tw', 'password')).to.be.rejectedWith(Error, 'No user was found for the provided email address.');
    });
    it('should reject when the provided email address is empty.', async function() {
      await expect(Repo.login('', 'password')).to.be.rejectedWith(Error, 'Unable to find user: no email address was provided.');
    });
    it('should reject when the cleartext password is wrong.', async function() {
      await expect(Repo.login(user.email, 'some other password')).to.be.rejectedWith(Error, 'The provided password was incorrect.');
    });
    it('should fulfill with a the user and session objects when the cleartext password is correct.', async function() {
      await expect(Repo.login(user.email, cleartext)).to.be.fulfilled.and.eventually.be.an('object').with.all.keys('user', 'session');
    });
  });

  describe('#retrieveSession', function() {
    let user;
    let token;
    before(async function() {
      // Unstub to simulate true behavior.
      stub.restore();
      const cleartext = 'test password';
      user = await createUser();
      user.set('password', cleartext);
      await user.save();
      const { session } = await Repo.login(user.email, cleartext);
      token = session.token;
    });
    after(async function() {
      stub = stubHash();
      await Repo.remove();
    });
    it('should fulfill with a valid user token.', async function() {
      await expect(Repo.retrieveSession(token)).to.be.fulfilled.and.eventually.be.an('object').with.all.keys('user', 'session');
    });
    it('should reject if a valid session was found, but the user no longer exists.', async function() {
      await Repo.removeByEmail(user.email);
      await expect(Repo.retrieveSession(token)).to.be.rejectedWith(Error, 'Unable to retrieve session: the provided user could not be found.');
    });
  });

});
