require('../../connections');
const Repo = require('../../../src/repositories/campaign');
const Model = require('../../../src/models/campaign');
const AdvertiserRepo = require('../../../src/repositories/advertiser');
const PlacementRepo = require('../../../src/repositories/placement');
const Utils = require('../../utils');

const createCampaign = async () => {
  const results = await Repo.seed();
  return results.one();
};

describe('repositories/campaign', function() {
  before(async function() {
    await Repo.remove();
  });
  after(async function() {
    await Repo.remove();
  });
  it('should export an object.', function(done) {
    expect(Repo).to.be.an('object');
    done();
  });

  describe('#create', function() {
    let advertiser;
    let placement;
    before(async function() {
      const ar = await AdvertiserRepo.seed();
      advertiser = ar.one();
      const pr = await PlacementRepo.seed();
      placement = pr.one();
    });
    it('should return a rejected promise when valiation fails.', async function() {
      await expect(Repo.create({})).to.be.rejectedWith(Error, /validation/i);
      await expect(Repo.create()).to.be.rejectedWith(Error, /validation/i);
    });
    it('should return a fulfilled promise with the model.', async function() {
      const payload = Repo.generate(1, {
        advertiserId: () => advertiser.id,
        placementId: () => placement.id,
      }).one();
      const campaign = await Repo.create(payload);
      const found = await Repo.findById(campaign.get('id'));

      expect(found).to.be.an.instanceof(Model);
      expect(found).to.have.property('id').equal(campaign.get('id'));
    });
  });

  describe('#update', function() {
    let campaign;
    before(async function() {
      campaign = await createCampaign();
    });
    it('should return a rejected promise when no ID is provided.', async function() {
      await expect(Repo.update()).to.be.rejectedWith(Error, 'Unable to update campaign: no ID was provided.');
    });
    it('should return a rejected promise when the ID cannot be found.', async function() {
      const id = '507f1f77bcf86cd799439011';
      await expect(Repo.update(id, { name: 'foo' })).to.be.rejectedWith(Error, `Unable to update campaign: no record was found for ID '${id}'`);
    });
    it('should return a rejected promise when valiation fails.', async function() {
      await expect(Repo.update(campaign.id)).to.be.rejectedWith(Error, /validation/i);
    });
    it('should return the updated model object.', async function() {
      const updated = await Repo.update(campaign.id, { name: 'Updated name.' });
      expect(updated).to.be.an.instanceof(Model);
      expect(updated).to.have.property('name').equal('Updated name.');
    });
  });

  describe('#findById', function() {
    let campaign;
    before(async function() {
      campaign = await createCampaign();
    });
    it('should return a rejected promise when no ID is provided.', async function() {
      await expect(Repo.findById()).to.be.rejectedWith(Error, 'Unable to find campaign: no ID was provided.');
    });
    it('should return a fulfilled promise with a `null` document when not found.', async function() {
      const id = '507f1f77bcf86cd799439011';
      await expect(Repo.findById(id)).to.be.fulfilled.and.become(null);
    });
    it('should return a fulfilled promise with a document when found.', async function() {
      await expect(Repo.findById(campaign.get('id'))).to.be.fulfilled.and.eventually.be.an.instanceof(Model).with.property('id').equal(campaign.get('id'));
    });
  });

  describe('#findByHash', function() {
    let campaign;
    before(async function() {
      campaign = await createCampaign();
    });
    it('should return a rejected promise when no hash is provided.', async function() {
      await expect(Repo.findByHash()).to.be.rejectedWith(Error, 'Unable to find campaign: no hash was provided.');
    });
    it('should return a fulfilled promise with a `null` document when not found.', async function() {
      const hash = '507f1f77bcf86cd799439011';
      await expect(Repo.findByHash(hash)).to.be.fulfilled.and.become(null);
    });
    it('should return a fulfilled promise with a document when found.', async function() {
      await expect(Repo.findByHash(campaign.get('hash'))).to.be.fulfilled.and.eventually.be.an.instanceof(Model).with.property('hash').equal(campaign.get('hash'));
    });
  });

  describe('#findForAdvertiser', function() {
    before(async function() {
      campaign = await createCampaign();
    });
    it('should return a fulfilled promise with the correct campaign.', async function() {
      await expect(Repo.findForAdvertiser(campaign.advertiserId)).to.be.fulfilled.and.eventually.be.an('array');
      const campaigns = await Repo.findForAdvertiser(campaign.advertiserId);
      expect(campaigns.map(c => c.id)).to.include(campaign.id);
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
        placementId: () => '2345',
      });
      expect(results).to.be.an('object');
      expect(results.length).to.equal(1);
      done();
    });
    it('should return a fixture result with the specified number of records.', function(done) {
      const results = Repo.generate(5, {
        advertiserId: () => '1234',
        placementId: () => '2345',
      });
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
    let campaign;
    before(async function() {
      campaign = await createCampaign();
    });
    it('should return a rejected promise when no ID is provided.', async function() {
      await expect(Repo.removeById()).to.be.rejectedWith(Error, 'Unable to remove campaign: no ID was provided.');
    });
    it('remove the requested campaign.', async function() {
      await expect(Repo.removeById(campaign.id)).to.be.fulfilled;
      await expect(Repo.findById(campaign.id)).to.be.fulfilled.and.eventually.be.null;
    });
  });
});
