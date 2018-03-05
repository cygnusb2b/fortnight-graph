require('../connections');
const Repo = require('../../src/repositories/publisher');
const Model = require('../../src/models/publisher');
const Utils = require('../utils');

const createPublisher = async () => {
  const results = await Repo.seed();
  return results.one();
};

describe('repositories/publisher', function() {
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
      const publisher = await Repo.create(payload);
      const found = await Repo.findById(publisher.get('id'));

      expect(found).to.be.an.instanceof(Model);
      expect(found).to.have.property('id').equal(publisher.get('id'));
    });
  });

  describe('#update', function() {
    let publisher;
    before(async function() {
      publisher = await createPublisher();
    });

    let spy;
    beforeEach(function(done) {
      spy = sinon.spy(Model, 'findOneAndUpdate');
      done();
    });
    afterEach(function(done) {
      if (spy.called) {
        sinon.assert.calledOnce(spy);
        sinon.assert.calledWith(spy, sinon.match.any, sinon.match.any, { new: true, runValidators: true });
      }
      spy.restore();
      done();
    });

    it('should return a rejected promise when no ID is provided.', async function() {
      await expect(Repo.update()).to.be.rejectedWith(Error, 'Unable to update publisher: no ID was provided.');
      sinon.assert.notCalled(spy);
    });
    it('should return a rejected promise when the ID cannot be found.', async function() {
      const id = '507f1f77bcf86cd799439011';
      await expect(Repo.update(id)).to.be.rejectedWith(Error, `Unable to update publisher: no record was found for ID '${id}'`);

    });
    it('should fulfill on an empty payload, but not update anything.', async function() {
      const id = publisher.id;
      const promise = Repo.update(id);
      await expect(promise).to.eventually.be.an.instanceOf(Model);
      const updated = await promise;

      ['name', 'html'].forEach((value) => {
        expect(updated[value]).to.equal(publisher[value]);
      });
      sinon.assert.calledWith(spy, { _id: id });
    });
    it('should return a rejected promise when valiation fails.', async function() {
      const id = publisher.id;
      const payload = { name: '' };
      await expect(Repo.update(id, payload)).to.be.rejectedWith(Error, /validation/i);
      sinon.assert.calledWith(spy, { _id: id });
    });
    it('should return the updated model object.', async function() {
      const id = publisher.id;
      const payload = { name: 'New Name' };
      const promise = Repo.update(id, payload);
      await expect(promise).to.eventually.be.an.instanceOf(Model);
      const updated = await promise;

      ['name'].forEach((value) => {
        expect(updated[value]).to.equal(payload[value]);
      });

      sinon.assert.calledWith(spy, { _id: id });
    });
  });

  describe('#findById', function() {
    let publisher;
    before(async function() {
      publisher = await createPublisher();
    });
    it('should return a rejected promise when no ID is provided.', async function() {
      await expect(Repo.findById()).to.be.rejectedWith(Error, 'Unable to find publisher: no ID was provided.');
    });
    it('should return a fulfilled promise with a `null` document when not found.', async function() {
      const id = '507f1f77bcf86cd799439011';
      await expect(Repo.findById(id)).to.be.fulfilled.and.become(null);
    });
    it('should return a fulfilled promise with a document when found.', async function() {
      await expect(Repo.findById(publisher.get('id'))).to.be.fulfilled.and.eventually.be.an.instanceof(Model).with.property('id').equal(publisher.get('id'));
    });
  });

  describe('#find', function() {
    it('should return a promise.', async function() {
      await expect(Repo.find()).to.be.fulfilled.and.eventually.be.an('array');
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

  describe('#seed', function() {
    it('should generate and save the fixture data.', async function() {
      await expect(Repo.seed()).to.be.fulfilled.and.eventually.be.an('object');
      await expect(Repo.seed({ count: 2 })).to.be.fulfilled.and.eventually.be.an('object');
    });
  });

  describe('#removeById', function() {
    let publisher;
    before(async function() {
      publisher = await createPublisher();
    });
    it('should return a rejected promise when no ID is provided.', async function() {
      await expect(Repo.removeById()).to.be.rejectedWith(Error, 'Unable to remove publisher: no ID was provided.');
    });
    it('remove the requested publisher.', async function() {
      await expect(Repo.removeById(publisher.id)).to.be.fulfilled;
      await expect(Repo.findById(publisher.id)).to.be.fulfilled.and.eventually.be.null;
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
});
