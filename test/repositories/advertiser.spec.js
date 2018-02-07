const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const Repo = require('../../src/repositories/advertiser');
const Utils = require('./utils');

chai.use(chaiAsPromised);
const expect = chai.expect;

describe('repositories/advertiser', function() {
  before(function() {
    return Repo.remove();
  });
  after(function() {
    return Repo.remove();
  });
  it('should export an object.', function(done) {
    expect(Repo).to.be.an('object');
    done();
  });
  describe('#findById', function() {
    it('should return a rejected promise when no ID is provided.', async function() {
      await expect(Repo.findById()).to.be.rejectedWith(Error, 'Unable to find advertiser: no ID was provided.');
    });
    it('should return a fulfilled promise with a `null` document when not found.', async function() {
      const id = '507f1f77bcf86cd799439011';
      await expect(Repo.findById(id)).to.be.fulfilled.and.become(null);
    });
    it('should return a fulfilled promise with a document when found.', async function() {
      const adv = await Repo.create({ name: 'Test findbyId Advertiser' });
      await expect(Repo.findById(adv.get('id'))).to.be.fulfilled.and.eventually.have.property('id').equal(adv.get('id'));
    });
  });
  describe('#create', function() {
    const names = [
      '', '   ', null, undefined,
    ];
    names.forEach((name) => {
      it(`should throw an error when the name is '${name}'.`, async function() {
        await expect(Repo.create({ name })).to.be.rejectedWith(Error);
      });
    });
    it('should throw an error when the payload is empty.', async function() {
      await expect(Repo.create()).to.be.rejectedWith(Error);
    });
    it('should trim the `name` field.', async function() {
      await expect(Repo.create({ name: ' name not trimed  ' })).to.be.fulfilled.and.eventually.have.property('name').equal('name not trimed');
    });
    it('should throw an error when the name is not unique.', async function() {
      const payload = { name: 'test advertiser' };
      await Repo.create(payload);
      await expect(Repo.create(payload)).to.be.rejectedWith(Error, /^E11000 duplicate key error/);
    });
    it('should return the expected model object.', async function() {
      const payload = { name: 'Another Advertiser' };
      const adv = await Repo.create(payload);
      const found = await Repo.findById(adv.get('id'));

      expect(found).to.be.an('object');
      expect(found).to.have.property('name').equal('Another Advertiser');
      const now = Date.now()
      expect(found).to.have.property('createdAt').be.a('date');
      expect(found).to.have.property('updatedAt').be.a('date');
    });
  });
  describe('#update', function() {
    it('should return a rejected promise when no ID is provided.', async function() {
      await expect(Repo.update()).to.be.rejectedWith(Error, 'Unable to update advertiser: no ID was provided.');
    });
    it('should return a rejected promise when the ID cannot be found..', async function() {
      const id = '507f1f77bcf86cd799439011';
      await expect(Repo.update(id)).to.be.rejectedWith(Error, `Unable to update advertiser: no record was found for ID '${id}'`);
    });
    it('should return the updated model object.', async function() {
      const payload = { name: 'This should be updated' };
      const adv = await Repo.create(payload);

      const updated = await Repo.update(adv.id, { name: 'Updated name.' });

      expect(updated).to.be.an('object');
      expect(updated).to.have.property('name').equal('Updated name.');
      expect(updated).to.have.property('createdAt').be.a('date');
      expect(updated.createdAt.getTime()).to.equal(adv.createdAt.getTime());
      expect(updated).to.have.property('updatedAt').be.a('date').gt(adv.get('updatedAt'))
    });
  });
  describe('#find', function() {
    it('should return a promise.', async function() {
      await expect(Repo.find()).to.be.fulfilled.and.eventually.be.an('array');
    });
  });
  describe('#paginate', function() {
    it('should return a Pagination instance.', function(done) {
      Utils.testPaginate(Repo);
      done();
    })
  });
});
