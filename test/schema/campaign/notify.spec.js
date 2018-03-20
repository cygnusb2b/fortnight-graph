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

describe('schema/campaign/notify', function() {
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

  describe('#notify', function() {
    let campaign;
    before(function() {
      campaign = generateCampaign(advertiser, placement);
    });
    it('should be an array.', function() {
      expect(campaign.get('notify')).to.be.an('object');
    });
  });

  describe('#notify.internal', function() {
    let campaign;
    before(function() {
      campaign = generateCampaign(advertiser, placement);
    });
    it('should be an array.', function() {
      expect(campaign.get('notify.internal')).to.be.an('array');
    });
  });

  describe('#notify.external', function() {
    let campaign;
    before(function() {
      campaign = generateCampaign(advertiser, placement);
    });
    it('should be an array.', function() {
      expect(campaign.get('notify.external')).to.be.an('array');
    });
  });

  describe('#notify.internal.name', function() {
    let campaign;
    before(function() {
      campaign = generateCampaign(advertiser, placement);
    });
    it('should be a string.', function() {
      expect(campaign.get('notify.internal.0.name')).to.be.a('string');
    });
  });

  describe('#notify.internal.value', function() {
    let campaign;
    before(function() {
      campaign = generateCampaign(advertiser, placement);
    });
    it('should be a string.', function() {
      expect(campaign.get('notify.internal.0.value')).to.be.a('string');
    });
  });

  describe('#notify.external.name', function() {
    let campaign;
    before(function() {
      campaign = generateCampaign(advertiser, placement);
    });
    it('should be a string.', function() {
      expect(campaign.get('notify.external.0.name')).to.be.a('string');
    });
  });

  describe('#notify.external.value', function() {
    let campaign;
    before(function() {
      campaign = generateCampaign(advertiser, placement);
    });
    it('should be a string.', function() {
      expect(campaign.get('notify.external.0.value')).to.be.a('string');
    });
  });
});
