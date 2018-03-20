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

  describe('#creatives.image', function() {
    let campaign;
    before(function() {
      campaign = generateCampaign(advertiser, placement);
    });
    it('should be an object.', function() {
      expect(campaign.get('creatives.0.image')).to.be.an('object');
    });
  });

  describe('#creatives.image.src', function() {
    let campaign;
    beforeEach(function() {
      campaign = generateCampaign(advertiser, placement);
    });
    it('should be trimmed.', function() {
      return testTrimmedField(Campaign, campaign, 'creatives.0.image.src', {
        value: '   https://www.google.com  ',
        expected: 'https://www.google.com',
        property: 'creatives[0].image.src',
      });
    });
    ['', null, undefined].forEach((value) => {
      it(`should be required and be rejected when the value is '${value}'`, function() {
        return testRequiredField(Campaign, campaign, 'creatives.0.image.src', value);
      });
    });
    ['foo.com', 'some value', 'http://www.foo.com', 'https://'].forEach((value) => {
      it(`should be rejected when the value is '${value}'`, async function() {
        campaign.set('creatives.0.image.src', value);
        await expect(campaign.save()).to.be.rejectedWith(Error, /Invalid image source URL/);
      });
    });
  });

  describe('#creatives.image.filePath', function() {
    let campaign;
    beforeEach(function() {
      campaign = generateCampaign(advertiser, placement);
    });
    it('should be trimmed and slashes removed.', function() {
      return testTrimmedField(Campaign, campaign, 'creatives.0.image.filePath', {
        value: ' /some/foo/file.jpg/  ',
        expected: 'some/foo/file.jpg',
        property: 'creatives[0].image.filePath',
      });
    });
    ['', null, undefined].forEach((value) => {
      it(`should be required and be rejected when the value is '${value}'`, function() {
        return testRequiredField(Campaign, campaign, 'creatives.0.image.filePath', value);
      });
    });
  });

  describe('#creatives.image.mimeType', function() {
    let campaign;
    beforeEach(function() {
      campaign = generateCampaign(advertiser, placement);
    });

    const allowed = ['image/jpeg', 'image/png', 'image/webm', 'image/gif'];
    allowed.forEach((value) => {
      it(`should be fulfilled when the enum value is '${value}'`, async function() {
        campaign.set('creatives.0.image.mimeType', value);
        await expect(campaign.save()).to.be.fulfilled;
      });
    });
    it('should reject when the value is not in the enum list.', async function() {
      campaign.set('creatives.0.image.mimeType', 'image/tiff');
      await expect(campaign.save()).to.be.rejectedWith(Error, /is not a valid enum value/);
    });
  });

  describe('#creatives.image.focalPoint', function() {
    let campaign;
    beforeEach(function() {
      campaign = generateCampaign(advertiser, placement);
    });

    [undefined, null].forEach((value) => {
      it(`should be fulfilled when set to '${value}'.`, async function() {
        campaign.set('creatives.0.image.focalPoint', value);
        await expect(campaign.save()).to.be.fulfilled;
      });
    });
    it(`should reject when set to an empty object.`, async function() {
      campaign.set('creatives.0.image.focalPoint', {});
      await expect(campaign.save()).to.be.rejectedWith(Error, /Validation failed/i);
    });
  });

  describe('#creatives.image.focalPoint.x', function() {
    let campaign;
    beforeEach(function() {
      campaign = generateCampaign(advertiser, placement);
    });
    [null, undefined].forEach((value) => {
      it(`should be required and be rejected when the value is '${value}'`, function() {
        return testRequiredField(Campaign, campaign, 'creatives.0.image.focalPoint.x', value);
      });
    });
    [-0.1, 1.1, 2].forEach((value) => {
      it(`should follow min/max constraints and be rejected when the value is '${value}'`, async function() {
        campaign.set('creatives.0.image.focalPoint.x', value);
        await expect(campaign.save()).to.be.rejectedWith(Error, /.*Validation failed.*[minimum|maximum].*/i);
      });
    });
    [0, 1, 0.8, 0.1].forEach((value) => {
      it(`should fulfill when min/max constraints are followed with value '${value}'`, async function() {
        campaign.set('creatives.0.image.focalPoint.x', value);
        await expect(campaign.save()).to.be.fulfilled;
      });
    });
  });

  describe('#creatives.image.focalPoint.y', function() {
    let campaign;
    beforeEach(function() {
      campaign = generateCampaign(advertiser, placement);
    });
    [null, undefined].forEach((value) => {
      it(`should be required and be rejected when the value is '${value}'`, function() {
        return testRequiredField(Campaign, campaign, 'creatives.0.image.focalPoint.y', value);
      });
    });
    [-0.1, 1.1, 2].forEach((value) => {
      it(`should follow min/max constraints and be rejected when the value is '${value}'`, async function() {
        campaign.set('creatives.0.image.focalPoint.y', value);
        await expect(campaign.save()).to.be.rejectedWith(Error, /.*Validation failed.*[minimum|maximum].*/i);
      });
    });
    [0, 1, 0.8, 0.1].forEach((value) => {
      it(`should fulfill when min/max constraints are followed with value '${value}'`, async function() {
        campaign.set('creatives.0.image.focalPoint.y', value);
        await expect(campaign.save()).to.be.fulfilled;
      });
    });
  });

});
