require('../connections');
const Advertiser = require('../../src/models/advertiser');
const Campaign = require('../../src/models/campaign');
const fixtures = require('../../src/fixtures');
const { testTrimmedField, testUniqueField, testRequiredField } = require('../utils');

const generateCampaign = (advertiser) => {
  return fixtures(Campaign, 1, {
    advertiserId: () => advertiser.id,
  }).one();
};

describe('schema/campaign', function() {
  let advertiser;
  before(async function() {
    await Campaign.remove();
    await Advertiser.remove();
    advertiser = await fixtures(Advertiser, 1).one().save();
  });
  after(async function() {
    await Campaign.remove();
    await Advertiser.remove();
  });

  it('should successfully save.', async function() {
    const campaign = generateCampaign(advertiser);
    await expect(campaign.save()).to.be.fulfilled;
  });

  describe('#name', function() {
    let campaign;
    beforeEach(function() {
      campaign = generateCampaign(advertiser);
    });
    it('should be trimmed.', function() {
      return testTrimmedField(Campaign, campaign, 'name');
    });
    ['', null, undefined].forEach((value) => {
      it(`should be required and be rejected when the value is '${value}'`, function() {
        return testRequiredField(Campaign, campaign, 'name', value);
      });
    });
  });

  describe('#advertiserId', function() {
    let campaign;
    beforeEach(function() {
      campaign = generateCampaign(advertiser);
    });
    [null, undefined].forEach((value) => {
      it(`should be required and be rejected when the value is '${value}'`, function() {
        return testRequiredField(Campaign, campaign, 'advertiserId', value);
      });
    });
    ['', 1234, '1234'].forEach((value) => {
      it(`should be a MongoId and be rejected when the value is '${value}'`, async function() {
        campaign.set('advertiserId', value);
        await expect(campaign.save()).to.be.rejectedWith(Error, /to ObjectID failed/i);
      });
    });
    it('should be rejected when the adveriser does not exist.', async function() {
      const id = '3f056e318e9a4da0d049fcc3';
      campaign.set('advertiserId', id);
      await expect(campaign.save()).to.be.rejectedWith(Error, `No advertiser found for ID ${id}`);
    });
  });

  describe('#status', function() {
    let campaign;
    beforeEach(function() {
      campaign = generateCampaign(advertiser);
    });

    [null, undefined].forEach((value) => {
      it(`should be required and be rejected when the value is '${value}'`, function() {
        return testRequiredField(Campaign, campaign, 'status', value);
      });
    });
    const allowed = ['Active', 'Draft', 'Paused', 'Deleted'];
    allowed.forEach((value) => {
      it(`should be fulfilled when the enum value is '${value}'`, async function() {
        campaign.set('status', value);
        await expect(campaign.save()).to.be.fulfilled;
      });
    });
    it('should reject when the value is not in the enum list.', async function() {
      campaign.set('status', 'draft');
      await expect(campaign.save()).to.be.rejectedWith(Error, /is not a valid enum value/);
    });
  });

  describe('#url', function() {
    let campaign;
    beforeEach(function() {
      campaign = generateCampaign(advertiser);
    });

    [null, undefined].forEach((value) => {
      it(`should be required and be rejected when the value is '${value}'`, function() {
        return testRequiredField(Campaign, campaign, 'url', value);
      });
    });

    it('should be trimmed.', function() {
      return testTrimmedField(Campaign, campaign, 'url', { value: ' http://somedomain.com  ', expected: 'http://somedomain.com' });
    });

    ['ftp://somedomain.com', 'some value', 'http://', 'http://foo', 'www.somedomain.com'].forEach((value) => {
      it(`should be required and be rejected when the value is '${value}'`, async function() {
        campaign.set('url', value);
        await expect(campaign.save()).to.be.rejectedWith(Error, /Invalid campaign URL/);
      });
    });
  });

  describe('#creatives', function() {
    let campaign;
    before(function() {
      campaign = generateCampaign(advertiser);
    });
    it('should be an array', function() {
      expect(campaign.get('creatives')).to.be.an('array');
    });
  });

  describe('#creatives.title', function() {
    let campaign;
    beforeEach(function() {
      campaign = generateCampaign(advertiser);
    });
    it('should be trimmed.', function() {
      return testTrimmedField(Campaign, campaign, 'creatives.0.title', { property: 'creatives[0].title' });
    });
  });

  describe('#creatives.teaser', function() {
    let campaign;
    beforeEach(function() {
      campaign = generateCampaign(advertiser);
    });
    it('should be trimmed.', function() {
      return testTrimmedField(Campaign, campaign, 'creatives.0.teaser', { property: 'creatives[0].teaser' });
    });
  });

  describe('#creatives.image', function() {
    let campaign;
    before(function() {
      campaign = generateCampaign(advertiser);
    });
    it('should be an object.', function() {
      expect(campaign.get('creatives.0.image')).to.be.an('object');
    });
  });

  describe('#creatives.image.src', function() {
    let campaign;
    beforeEach(function() {
      campaign = generateCampaign(advertiser);
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
  });

  describe('#creatives.image.filePath', function() {
    let campaign;
    beforeEach(function() {
      campaign = generateCampaign(advertiser);
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

});
