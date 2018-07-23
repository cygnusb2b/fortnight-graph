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

describe('schema/campaign/criteria', function() {
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

  describe('#criteria', function() {
    let campaign;
    before(function() {
      campaign = generateCampaign(advertiser, placement);
    });
    it('should be an object', function() {
      expect(campaign.get('criteria')).to.be.an('object');
    });
  });

  describe('#criteria.start', function() {
    let campaign;
    beforeEach(function() {
      campaign = generateCampaign(advertiser, placement);
    });
    it('should be a date.', function() {
      expect(campaign.get('criteria.start')).to.be.a('date');
    });
  });

  describe('#criteria.end', function() {
    let campaign;
    beforeEach(function() {
      campaign = generateCampaign(advertiser, placement);
    });
    it('should be a date.', function() {
      expect(campaign.get('criteria.end')).to.be.a('date');
    });
  });

  describe('#criteria.placements', function() {
    let campaign;
    before(function() {
      campaign = generateCampaign(advertiser, placement);
    });
    it('should be an array of ObjectIds.', function() {
      expect(campaign.get('criteria.placementIds')).to.be.an('array');
    });
  });

  describe('#criteria.kvs', function() {
    let campaign;
    before(function() {
      campaign = generateCampaign(advertiser, placement);
    });
    it('should be an array.', function() {
      expect(campaign.get('criteria.kvs')).to.be.an('array');
    });
  });

  describe('#criteria.kvs.key', function() {
    let campaign;
    before(function() {
      campaign = generateCampaign(advertiser, placement);
    });
    it('should be a string.', function() {
      expect(campaign.get('criteria.kvs.0.key')).to.be.a('string');
    });
  });

  describe('#criteria.kvs.value', function() {
    let campaign;
    before(function() {
      campaign = generateCampaign(advertiser, placement);
    });
    it('should be a string.', function() {
      expect(campaign.get('criteria.kvs.0.value')).to.be.a('string');
    });
  });

});
