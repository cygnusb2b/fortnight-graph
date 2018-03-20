require('../../connections');
const Advertiser = require('../../../src/models/advertiser');
const Campaign = require('../../../src/models/campaign');
const Placement = require('../../../src/models/placement');
const Publisher = require('../../../src/models/publisher');
const fixtures = require('../../../src/fixtures');
const { testTrimmedField, testUniqueField, testRequiredField } = require('../../utils');

const generateCampaign = (advertiser, placement) => {
  return fixtures(Campaign, 1, {
    advertiserId: () => advertiser.id,
    placementId: () => placement.id,
  }).one();
};

describe('schema/campaign/externalLinks', function() {
  let advertiser;
  let placement;
  before(async function() {
    await Advertiser.remove({});
    await Campaign.remove({});
    await Placement.remove({});
    await Publisher.remove({});
    const publisher = await fixtures(Publisher, 1).one().save();
    advertiser = await fixtures(Advertiser, 1).one().save();
    placement = await fixtures(Placement, 1, {
      publisherId: () => publisher.id
    }).one().save();
  });
  after(async function() {
    await Campaign.remove();
    await Advertiser.remove();
    await Placement.remove();
    await Publisher.remove({});
  });

  it('should successfully save.', async function() {
    const campaign = generateCampaign(advertiser, placement);
    await expect(campaign.save()).to.be.fulfilled;
  });

  describe('#externalLinks', function() {
    let campaign;
    before(function() {
      campaign = generateCampaign(advertiser, placement);
    });
    it('should be an array.', function() {
      expect(campaign.get('externalLinks')).to.be.an('array');
    });
  });

  describe('#externalLinks.label', function() {
    let campaign;
    before(function() {
      campaign = generateCampaign(advertiser, placement);
    });
    it('should be a string.', function() {
      expect(campaign.get('externalLinks.0.label')).to.be.a('string');
    });
  });

  describe('#externalLinks.url', function() {
    let campaign;
    before(function() {
      campaign = generateCampaign(advertiser, placement);
    });
    it('should be a string.', function() {
      expect(campaign.get('externalLinks.0.url')).to.be.a('string');
    });
  });
});
