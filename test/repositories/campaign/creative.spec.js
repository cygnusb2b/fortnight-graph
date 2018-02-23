require('../../connections');
const Repo = require('../../../src/repositories/campaign/creative');
const Campaign = require('../../../src/models/campaign');
const CampaignRepo = require('../../../src/repositories/campaign');

const createCampaign = async () => {
  const results = await CampaignRepo.seed();
  return results.one();
};

describe('repositories/campaign/creative', function() {
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

  describe('#createFor', function() {
    let campaign;
    before(async function() {
      campaign = await createCampaign();
    });
    it('should reject when no campaign ID is provided.', async function() {
      await expect(Repo.createFor()).to.be.rejectedWith(Error, 'Unable to handle creative: no campaign ID was provided.');
    });
    it('should reject when the provided campaign does not exist.', async function() {
      const campaignId = '507f1f77bcf86cd799439011';
      await expect(Repo.createFor(campaignId)).to.be.rejectedWith(Error, 'Unable to handle creative: no campaign was found.');
    });
    it('should fulfill and add the creative.', async function() {
      const payload = { title: 'Some new title' };
      const length = campaign.get('creatives').length;
      await expect(Repo.createFor(campaign.id, payload)).to.eventually.be.an('object').with.property('title', payload.title);
      const found = await CampaignRepo.findById(campaign.id);
      expect(found.get('creatives').length).to.equal(length + 1);
    });
  });

  describe('#removeFrom', function() {
    let campaign;
    before(async function() {
      campaign = await createCampaign();
    });
    it('should reject when no creative ID is provided.', async function() {
      const campaignId = '507f1f77bcf86cd799439011';
      await expect(Repo.removeFrom(campaignId)).to.be.rejectedWith(Error, 'Unable to handle creative: no creative ID was provided.');
    });
    it('should reject when no campaign ID is provided.', async function() {
      await expect(Repo.removeFrom(undefined, '507f1f77bcf86cd799439011')).to.be.rejectedWith(Error, 'Unable to handle creative: no campaign ID was provided.');
    });
    it('should reject when the provided campaign does not exist.', async function() {
      const campaignId = '507f1f77bcf86cd799439011';
      await expect(Repo.removeFrom(campaignId, '507f1f77bcf86cd799439011')).to.be.rejectedWith(Error, 'Unable to handle creative: no campaign was found.');
    });
    it('should reject when attempting to remove a creative that does not exist.', async function() {
      const creativeId = '507f1f77bcf86cd799439011';
      await expect(Repo.removeFrom(campaign.id, creativeId)).to.be.rejectedWith(Error, 'Unable to handle creative: no creative was found for the provided ID.');
    });
    it('should fulfill and remove the creative.', async function() {
      const length = campaign.get('creatives').length;
      const creative = campaign.get('creatives.0');
      await expect(Repo.removeFrom(campaign.id, creative.id)).to.eventually.be.an.instanceOf(Campaign);

      const found = await CampaignRepo.findById(campaign.id);
      expect(found.get('creatives').length).to.equal(length - 1);
      expect(found.get('creatives').id(creative.id)).to.be.null;
    });
  });

});
