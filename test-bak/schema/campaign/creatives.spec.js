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

describe('schema/campaign/creatives', function() {
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

  describe('#creatives', function() {
    let campaign;
    before(function() {
      campaign = generateCampaign(advertiser, placement);
    });
    it('should be an array', function() {
      expect(campaign.get('creatives')).to.be.an('array');
    });
  });

  describe('#creatives.length', function() {
    let campaign;
    before(function() {
      campaign = generateCampaign(advertiser, placement);
    });
    it('should be a number greater than 0', function(done) {
      expect(campaign.get('creatives.length')).to.be.gt(0);
      done();
    });
  });

  describe('#creatives.title', function() {
    let campaign;
    beforeEach(function() {
      campaign = generateCampaign(advertiser, placement);
    });
    it('should be trimmed.', function() {
      return testTrimmedField(Campaign, campaign, 'creatives.0.title', { property: 'creatives[0].title' });
    });
  });

  describe('#creatives.teaser', function() {
    let campaign;
    beforeEach(function() {
      campaign = generateCampaign(advertiser, placement);
    });
    it('should be trimmed.', function() {
      return testTrimmedField(Campaign, campaign, 'creatives.0.teaser', { property: 'creatives[0].teaser' });
    });
  });
});
