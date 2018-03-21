require('../connections');
const Repo = require('../../src/repositories/contact');
const AdvertiserRepo = require('../../src/repositories/advertiser');
const Model = require('../../src/models/contact');
const Advertiser = require('../../src/models/advertiser');
const Utils = require('../utils');

const createContact = () => Repo.generate().one().save();
const createAdvertiser = async () => {
  const results = await AdvertiserRepo.seed();
  return results.one();
};

describe('repositories/contact', function() {
  let stub;
  before(function() {
    stub = Utils.stubHash();
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

  describe('#update', function() {
    let contact;
    before(async function() {
      contact = await createContact();
    });
    it('should return a rejected promise when no ID is provided.', async function() {
      await expect(Repo.update()).to.be.rejectedWith(Error, 'Unable to update contact: no ID was provided.');
    });
    it('should return a rejected promise when the ID cannot be found.', async function() {
      const id = '507f1f77bcf86cd799439011';
      await expect(Repo.update(id, { email: 'foo@bar.baz', givenName: 'foo' })).to.be.rejectedWith(Error, `Unable to update contact: no record was found for ID '${id}'`);
    });
    it('should return a rejected promise when valiation fails.', async function() {
      await expect(Repo.update(contact.id)).to.be.rejectedWith(Error, /validation/i);
    });
    it('should return the updated model object.', async function() {
      const updated = await Repo.update(contact.id, { email: 'foo@bar.baz', givenName: 'FIRST', familyName: 'LAST' });
      expect(updated).to.be.an('object');
      expect(updated).to.be.an.instanceof(Model).with.property('givenName').equal('FIRST');
      expect(updated).to.be.an.instanceof(Model).with.property('familyName').equal('LAST');
    });
  });

  describe('#findById', function() {
    let contact;
    before(async function() {
      contact = await createContact();
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

  describe('#removeById', function() {
    let contact;
    before(async function() {
      contact = await createContact();
    });
    it('should return a rejected promise when no ID is provided.', async function() {
      await expect(Repo.removeById()).to.be.rejectedWith(Error, 'Unable to remove contact: no ID was provided.');
    });
    it('remove the requested contact.', async function() {
      await expect(Repo.removeById(contact.id)).to.be.fulfilled;
      await expect(Repo.findById(contact.id)).to.be.fulfilled.and.eventually.be.null;
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



  describe('#addContactTo', function() {
    let advertiser;
    let contact;
    before(async function() {
      advertiser = await createAdvertiser();
      contact = await createContact();
    });
    it('should reject when invalid types are specified', async function() {
      const advertiserId = advertiser.id;
      const types = [false, null, undefined, '', 'does-not-exist'];
      types.forEach(type => expect(Repo.addContactTo(Advertiser, advertiserId, type)).to.be.rejectedWith(Error, /Invalid notification type/i));
    });
    it('should reject when the provided advertiser does not exist.', async function() {
      const advertiserId = '507f1f77bcf86cd799439011';
      const type = 'internal';
      await expect(Repo.addContactTo(Advertiser, advertiserId, type)).to.be.rejectedWith(Error, /Validation/i);
    });
    it('should reject when the provided contact does not exist.', async function() {
      const advertiserId = advertiser.id;
      const contactId = '507f1f77bcf86cd799439011';
      const type = 'internal';
      await expect(Repo.addContactTo(Advertiser, advertiserId, type, contactId)).to.be.rejectedWith(Error, /Validation/i);
    });
    it('should fulfill and add the contact.', async function() {
      const advertiserId = advertiser.id;
      const contactId = contact.id;
      const type = 'internal';
      const res = await Repo.addContactTo(Advertiser, advertiserId, type, contactId);
      expect(res).to.be.an('object');
      expect(res.notify.internal).to.be.an('array').and.include(contactId);
    });
  });

  describe('#removeContactFrom', function() {
    let advertiser;
    let contact;
    before(async function() {
      advertiser = await createAdvertiser();
      contact = await createContact();
    });
    it('should reject when invalid types are specified', async function() {
      const advertiserId = advertiser.id;
      const types = [false, null, undefined, '', 'does-not-exist'];
      types.forEach(type => expect(Repo.removeContactFrom(Advertiser, advertiserId, type)).to.be.rejectedWith(Error, /Invalid notification type/i));
    });
    it('should reject when the provided advertiser does not exist.', async function() {
      const advertiserId = '507f1f77bcf86cd799439011';
      const type = 'internal';
      await expect(Repo.removeContactFrom(Advertiser, advertiserId, type)).to.be.rejectedWith(Error, /no record was found/i);
    });
    it('should not reject when the provided contact does not exist.', async function() {
      const advertiserId = advertiser.id;
      const contactId = '507f1f77bcf86cd799439011';
      const type = 'internal';
      await expect(Repo.removeContactFrom(Advertiser, advertiserId, type, contactId)).to.eventually.be.an('object');
    });
    it('should fulfill and remove the contact.', async function() {
      const advertiserId = advertiser.id;
      const contactId = contact.id;
      const type = 'internal';
      const res = await Repo.removeContactFrom(Advertiser, advertiserId, type, contactId);
      expect(res).to.be.an('object');
      expect(res.notify.internal).to.be.an('array').and.not.include(contactId);
    });
  });

});
