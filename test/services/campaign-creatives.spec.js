require('../connections');
const CampaignCreatives = require('../../src/services/campaign-creatives');
const Campaign = require('../../src/models/campaign');
const Placement = require('../../src/models/placement');
const seed = require('../../src/fixtures/seed');

describe('services/campaign-creatives', function() {
  before(async function() {
    await Placement.remove();
    await Campaign.remove();
  });
  after(async function() {
    await Campaign.remove();
    await Placement.remove();
  });
  it('should export an object.', function(done) {
    expect(CampaignCreatives).to.be.an('object');
    done();
  });

  describe('#createFor', function() {
    let campaign;
    before(async function() {
      campaign = await seed.campaigns(1);
    });
    it('should reject when no campaign ID is provided.', async function() {
      await expect(CampaignCreatives.createFor()).to.be.rejectedWith(Error, `No campaign found for ID 'undefined'`);
    });
    it('should reject when the provided campaign does not exist.', async function() {
      const campaignId = '507f1f77bcf86cd799439011';
      await expect(CampaignCreatives.createFor(campaignId)).to.be.rejectedWith(Error, `No campaign found for ID '507f1f77bcf86cd799439011'`);
    });
    it('should fulfill and add the creative.', async function() {
      const payload = { title: 'Some new title' };
      const length = campaign.get('creatives').length;
      await expect(CampaignCreatives.createFor(campaign.id, payload)).to.eventually.be.an('object').with.property('title', payload.title);
      const found = await Campaign.findById(campaign.id);
      expect(found.get('creatives').length).to.equal(length + 1);
    });
  });

  describe('#removeFrom', function() {
    let campaign;
    before(async function() {
      campaign = await seed.campaigns(1);
    });
    it('should reject when no creative ID is provided.', async function() {
      const campaignId = '507f1f77bcf86cd799439011';
      await expect(CampaignCreatives.removeFrom(campaignId)).to.be.rejectedWith(Error, 'Unable to handle creative: no creative ID was provided.');
    });
    it('should reject when no campaign ID is provided.', async function() {
      await expect(CampaignCreatives.removeFrom(undefined, '507f1f77bcf86cd799439011')).to.be.rejectedWith(Error, `No campaign found for ID 'undefined'`);
    });
    it('should reject when the provided campaign does not exist.', async function() {
      const campaignId = '507f1f77bcf86cd799439011';
      await expect(CampaignCreatives.removeFrom(campaignId, '507f1f77bcf86cd799439011')).to.be.rejectedWith(Error, `No campaign found for ID '507f1f77bcf86cd799439011'`);
    });
    it('should reject when attempting to remove a creative that does not exist.', async function() {
      const creativeId = '507f1f77bcf86cd799439011';
      await expect(CampaignCreatives.removeFrom(campaign.id, creativeId)).to.be.rejectedWith(Error, 'Unable to handle creative: no creative was found for the provided ID.');
    });
    it('should fulfill and remove the creative.', async function() {
      const length = campaign.get('creatives').length;
      const creative = campaign.get('creatives.0');
      await expect(CampaignCreatives.removeFrom(campaign.id, creative.id)).to.eventually.be.an.instanceOf(Campaign);

      const found = await Campaign.findById(campaign.id);
      expect(found.get('creatives').length).to.equal(length - 1);
      expect(found.get('creatives').id(creative.id)).to.be.null;
    });
  });

});
