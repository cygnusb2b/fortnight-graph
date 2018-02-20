require('../connections');
const Repo = require('../../src/repositories/session');

describe('repositories/session', function() {
  const uid = '1234';
  let session;
  before(async function() {
    session = await Repo.set({ uid });
  });
  after(async function() {
    await Repo.delete({ id: session.id, uid });
  });

  it('should export an object.', function(done) {
    expect(Repo).to.be.an('object');
    done();
  });

  describe('#set', function() {
    const uid = '5678';
    it('should return a rejected promise when no uid is provided.', async function() {
      await expect(Repo.set({ uid: null })).to.be.rejectedWith(Error, 'The user ID is required.');
    });
    it('should be fulfilled', async function() {
      await expect(Repo.set({ uid })).to.be.fulfilled;
    });
  });

  describe('#get', function() {
    let removedToken;
    before(async function() {
      const toRemove = await Repo.set({ uid: 'abcdef' });
      removedToken = toRemove.token;
      await Repo.delete({ uid: 'abcdef', id: toRemove.id });
    });

    it('should return a rejected promise when no token is provided.', async function() {
      await expect(Repo.get()).to.be.rejectedWith(Error, 'Unable to get session: no token was provided.');
    });
    it('should return a rejected promise when the token format is invalid.', async function() {
      await expect(Repo.get('badformattedtoken')).to.be.rejectedWith(Error, 'Unable to get session: invalid token format.');
    });
    it('should return a rejected promise when the token cannot be found.', async function() {
      await expect(Repo.get(removedToken)).to.be.rejectedWith(Error, 'Unable to get session: no token found in storage.');
    });
    it('should be fulfilled', async function() {
      await expect(Repo.get(session.token)).to.be.fulfilled;
    });
  });

});
