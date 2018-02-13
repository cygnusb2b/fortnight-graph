require('../connections');
const bcrypt = require('bcrypt');
const Repo = require('../../src/repositories/user');
const { stubHash } = require('../utils');

const createUser = () => Repo.generate().one().save();

describe('repositories/user', function() {
  let stub;
  before(function() {
    stub = stubHash();
    return Repo.remove();
  });
  after(function() {
    stub.restore();
    return Repo.remove();
  });
  it('should export an object.', function(done) {
    expect(Repo).to.be.an('object');
    done();
  });

  describe('#create', function() {
    it('should return a rejected promise when valiation fails.', async function() {
      await expect(Repo.create({})).to.be.rejectedWith(Error, /validation/i);
      await expect(Repo.create()).to.be.rejectedWith(Error, /validation/i);
    });
    it('should return a fulfilled promise with the model.', async function() {
      const payload = Repo.generate().one();
      const user = await Repo.create(payload);
      const found = await Repo.findById(user.get('id'));

      expect(found).to.be.an('object');
      expect(found).to.have.property('id').equal(user.get('id'));
    });
  });

  describe('#findById', function() {
    let user;
    before(async function() {
      user = await createUser();
    });
    after(async function() {
      await Repo.remove();
    });
    it('should return a rejected promise when no ID is provided.', async function() {
      await expect(Repo.findById()).to.be.rejectedWith(Error, 'Unable to find user: no ID was provided.');
    });
    it('should return a fulfilled promise with a `null` document when not found.', async function() {
      const id = '507f1f77bcf86cd799439011';
      await expect(Repo.findById(id)).to.be.fulfilled.and.become(null);
    });
    it('should return a fulfilled promise with a document when found.', async function() {
      await expect(Repo.findById(user.get('id'))).to.be.fulfilled.and.eventually.have.property('id').equal(user.get('id'));
    });
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

  describe('#findByEmail', function() {
    let user;
    before(async function() {
      user = await createUser();
    });
    after(async function() {
      await Repo.remove();
    });
    [null, undefined, '', '   '].forEach((value) => {
      it(`should return a rejected promise when the email is '${value}'.`, async function() {
        await expect(Repo.findByEmail(value)).to.be.rejectedWith(Error, 'Unable to find user: no email address was provided.');
      });
    });
    it('should return a fulfilled promise with a `null` document when not found.', async function() {
      const email = 'some-address@domain.com';
      await expect(Repo.findByEmail(email)).to.be.fulfilled.and.become(null);
    });
    it('should return a fulfilled promise with a document when found.', async function() {
      await expect(Repo.findByEmail(user.get('email'))).to.be.fulfilled.and.eventually.have.property('id').equal(user.get('id'));
    });
  });

  describe('#generate', function() {
    it('should return a fixture result with one record.', function(done) {
      const results = Repo.generate();
      expect(results).to.be.an('object');
      expect(results.length).to.equal(1);
      done();
    });
    it('should return a fixture result with the specified number of records.', function(done) {
      const results = Repo.generate(5);
      expect(results).to.be.an('object');
      expect(results.length).to.equal(5);
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
      user = Repo.generate().one();
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
      user = Repo.generate().one();
      user.set('password', cleartext);
      await user.save();
      const { session } = await Repo.login(user.email, cleartext);
      token = session.token;
    });
    after(async function() {
      stub = stubHash();
      await Repo.remove();
    });
    it('should reject if a valid session was found, but the user no longer exists.', async function() {
      await Repo.removeByEmail(user.email);
      await expect(Repo.retrieveSession(token)).to.be.rejectedWith(Error, 'Unable to retrieve session: the provided user could not be found.');
    });
  });

});
