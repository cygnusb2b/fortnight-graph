require('../../connections');
const Repo = require('../../../src/repositories/campaign');
const AdvertiserRepo = require('../../../src/repositories/advertiser');
const Utils = require('../../utils');

const createCampaign = async () => {
  const advertiser = await AdvertiserRepo.generate().one().save();
  const campaign = await Repo.generate(1, {
    advertiserId: () => advertiser.id,
    creatives: () => [],
  }).one().save();
  return { advertiser, campaign }
};

describe('repositories/campaign', function() {
  before(async function() {
    await Repo.remove();
    await AdvertiserRepo.remove();
  });
  after(async function() {
    await Repo.remove();
    await AdvertiserRepo.remove();
  });
  it('should export an object.', function(done) {
    expect(Repo).to.be.an('object');
    done();
  });

  describe('#create', function() {
    let advertiser;
    before(async function() {
      advertiser = await AdvertiserRepo.generate().one().save();
    });
    it('should return a rejected promise when valiation fails.', async function() {
      await expect(Repo.create({})).to.be.rejectedWith(Error, /validation/i);
      await expect(Repo.create()).to.be.rejectedWith(Error, /validation/i);
    });
    it('should return a fulfilled promise with the model.', async function() {
      const payload = Repo.generate(1, {
        advertiserId: () => advertiser.id,
        creatives: () => [],
      }).one();
      const campaign = await Repo.create(payload);
      const found = await Repo.findById(campaign.get('id'));

      expect(found).to.be.an('object');
      expect(found).to.have.property('id').equal(campaign.get('id'));
    });
  });

  describe('#update', function() {
    let models;
    before(async function() {
      models = await createCampaign();
    });
    it('should return a rejected promise when no ID is provided.', async function() {
      await expect(Repo.update()).to.be.rejectedWith(Error, 'Unable to update campaign: no ID was provided.');
    });
    it('should return a rejected promise when the ID cannot be found.', async function() {
      const id = '507f1f77bcf86cd799439011';
      await expect(Repo.update(id, { name: 'foo' })).to.be.rejectedWith(Error, `Unable to update campaign: no record was found for ID '${id}'`);
    });
    it('should return a rejected promise when valiation fails.', async function() {
      const { campaign } = models;
      await expect(Repo.update(campaign.id)).to.be.rejectedWith(Error, /validation/i);
    });
    it('should return the updated model object.', async function() {
      const { campaign } = models;
      const updated = await Repo.update(campaign.id, { name: 'Updated name.' });
      expect(updated).to.be.an('object');
      expect(updated).to.have.property('name').equal('Updated name.');
    });
  });

  describe('#findById', function() {
    let models;
    before(async function() {
      models = await createCampaign();
    });
    it('should return a rejected promise when no ID is provided.', async function() {
      await expect(Repo.findById()).to.be.rejectedWith(Error, 'Unable to find campaign: no ID was provided.');
    });
    it('should return a fulfilled promise with a `null` document when not found.', async function() {
      const id = '507f1f77bcf86cd799439011';
      await expect(Repo.findById(id)).to.be.fulfilled.and.become(null);
    });
    it('should return a fulfilled promise with a document when found.', async function() {
      const { campaign } = models;
      await expect(Repo.findById(campaign.get('id'))).to.be.fulfilled.and.eventually.have.property('id').equal(campaign.get('id'));
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

  describe('#generate', function() {
    it('should return a fixture result with one record.', function(done) {
      const results = Repo.generate(undefined, {
        advertiserId: () => '1234',
        creatives: () => [],
      });
      expect(results).to.be.an('object');
      expect(results.length).to.equal(1);
      done();
    });
    it('should return a fixture result with the specified number of records.', function(done) {
      const results = Repo.generate(5, {
        advertiserId: () => '1234',
        creatives: () => [],
      });
      expect(results).to.be.an('object');
      expect(results.length).to.equal(5);
      done();
    });
  });

  describe('#removeById', function() {
    let models;
    before(async function() {
      models = await createCampaign();
    });
    it('should return a rejected promise when no ID is provided.', async function() {
      await expect(Repo.removeById()).to.be.rejectedWith(Error, 'Unable to remove campaign: no ID was provided.');
    });
    it('remove the requested campaign.', async function() {
      const { campaign } = models;
      await expect(Repo.removeById(campaign.id)).to.be.fulfilled;
      await expect(Repo.findById(campaign.id)).to.be.fulfilled.and.eventually.be.null;
    });
  });
});
