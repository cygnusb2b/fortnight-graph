require('../connections');
const Repo = require('../../src/repositories/advertiser');
const ContactRepo = require('../../src/repositories/contact');
const Model = require('../../src/models/advertiser');
const Utils = require('../utils');

const createAdvertiser = async () => {
  const results = await Repo.seed();
  return results.one();
};
const createContact = async () => {
  const results = await ContactRepo.seed();
  return results.one();
};

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

  describe('#create', function() {
    it('should return a rejected promise when valiation fails.', async function() {
      await expect(Repo.create({})).to.be.rejectedWith(Error, /validation/i);
      await expect(Repo.create()).to.be.rejectedWith(Error, /validation/i);
    });
    it('should return a fulfilled promise with the model.', async function() {
      const payload = Repo.generate().one();
      const advertiser = await Repo.create(payload);
      const found = await Repo.findById(advertiser.get('id'));

      expect(found).to.be.an.instanceof(Model);
      expect(found).to.have.property('id').equal(advertiser.get('id'));
    });
  });

  describe('#update', function() {
    let advertiser;
    before(async function() {
      advertiser = await createAdvertiser();
    });
    it('should return a rejected promise when no ID is provided.', async function() {
      await expect(Repo.update()).to.be.rejectedWith(Error, 'Unable to update advertiser: no ID was provided.');
    });
    it('should return a rejected promise when the ID cannot be found.', async function() {
      const id = '507f1f77bcf86cd799439011';
      await expect(Repo.update(id, { name: 'foo' })).to.be.rejectedWith(Error, `Unable to update advertiser: no record was found for ID '${id}'`);
    });
    it('should return a rejected promise when valiation fails.', async function() {
      await expect(Repo.update(advertiser.id)).to.be.rejectedWith(Error, /validation/i);
    });
    it('should return the updated model object.', async function() {
      const updated = await Repo.update(advertiser.id, { name: 'Updated name.' });
      expect(updated).to.be.an('object');
      expect(updated).to.be.an.instanceof(Model).with.property('name').equal('Updated name.');
    });
  });

  describe('#findById', function() {
    let advertiser;
    before(async function() {
      advertiser = await createAdvertiser();
    });
    it('should return a rejected promise when no ID is provided.', async function() {
      await expect(Repo.findById()).to.be.rejectedWith(Error, 'Unable to find advertiser: no ID was provided.');
    });
    it('should return a fulfilled promise with a `null` document when not found.', async function() {
      const id = '507f1f77bcf86cd799439011';
      await expect(Repo.findById(id)).to.be.fulfilled.and.become(null);
    });
    it('should return a fulfilled promise with a document when found.', async function() {
      await expect(Repo.findById(advertiser.get('id'))).to.be.fulfilled.and.eventually.be.an.instanceof(Model).with.property('id').equal(advertiser.get('id'));
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

  describe('#search', function() {
    it('should return a Pagination instance.', function(done) {
      Utils.testSearch(Repo);
      done();
    })
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

  describe('#seed', function() {
    it('should generate and save the fixture data.', async function() {
      await expect(Repo.seed()).to.be.fulfilled.and.eventually.be.an('object');
      await expect(Repo.seed({ count: 2 })).to.be.fulfilled.and.eventually.be.an('object');
    });
  });

  describe('#removeById', function() {
    let advertiser;
    before(async function() {
      advertiser = await createAdvertiser();
    });
    it('should return a rejected promise when no ID is provided.', async function() {
      await expect(Repo.removeById()).to.be.rejectedWith(Error, 'Unable to remove advertiser: no ID was provided.');
    });
    it('remove the requested advertiser.', async function() {
      await expect(Repo.removeById(advertiser.id)).to.be.fulfilled;
      await expect(Repo.findById(advertiser.id)).to.be.fulfilled.and.eventually.be.null;
    });
  });
});
