require('../connections');
const Repo = require('../../src/repositories/contact');
const Model = require('../../src/models/contact');
const { stubHash } = require('../utils');

const createUser = () => Repo.generate().one().save();

describe('repositories/contact', function() {
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
      const contact = await Repo.create(payload);
      const found = await Repo.findById(contact.get('id'));

      expect(found).to.be.an.instanceof(Model);
      expect(found).to.have.property('id').equal(contact.get('id'));
    });
  });

  describe('#findById', function() {
    let contact;
    before(async function() {
      contact = await createUser();
    });
    after(async function() {
      await Repo.remove();
    });
    it('should return a rejected promise when no ID is provided.', async function() {
      await expect(Repo.findById()).to.be.rejectedWith(Error, 'Unable to find contact: no ID was provided.');
    });
    it('should return a fulfilled promise with a `null` document when not found.', async function() {
      const id = '507f1f77bcf86cd799439011';
      await expect(Repo.findById(id)).to.be.fulfilled.and.become(null);
    });
    it('should return a fulfilled promise with a document when found.', async function() {
      await expect(Repo.findById(contact.get('id'))).to.be.fulfilled.and.eventually.be.an.instanceof(Model).with.property('id').equal(contact.get('id'));
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

});
