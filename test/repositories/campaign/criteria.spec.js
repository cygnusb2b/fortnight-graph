require('../../connections');
const Repo = require('../../../src/repositories/campaign/criteria');
const Campaign = require('../../../src/models/campaign');
const CampaignRepo = require('../../../src/repositories/campaign');

const createCampaign = async () => {
  const results = await CampaignRepo.seed();
  return results.one();
};

describe('repositories/campaign/criteria', function() {
  before(async function() {
    await CampaignRepo.remove();
  });
  after(async function() {
    await CampaignRepo.remove();
  });
  it('should export an object.', function(done) {
    expect(Repo).to.be.an('object');
    done();
  });

  describe('#setFor', function() {
    let campaign;
    before(async function() {
      campaign = await createCampaign();
    });
    it('should reject when no campaign ID is provided.', async function() {
      await expect(Repo.setFor()).to.be.rejectedWith(Error, 'Unable to handle criteria: no campaign ID was provided.');
    });
    it('should reject when the provided campaign does not exist.', async function() {
      const campaignId = '507f1f77bcf86cd799439011';
      await expect(Repo.setFor(campaignId)).to.be.rejectedWith(Error, 'Unable to handle criteria: no campaign was found.');
    });
    it('should fulfill and add the criteria.', async function() {
      const payload = { start: new Date() };
      const created = await Repo.setFor(campaign.id, payload);
      expect(created).to.be.an('object').with.property('start');
      expect(created.start).to.be.a('date');
      expect(created.start.getTime()).to.equal(payload.start.getTime());
      const found = await CampaignRepo.findById(campaign.id);
      expect(found.get('criteria')).to.be.an('object').with.property('start');
      expect(found.get('criteria.start').getTime()).to.equal(payload.start.getTime());
    });
  });

});
