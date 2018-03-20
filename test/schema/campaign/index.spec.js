require('../../connections');
const Advertiser = require('../../../src/models/advertiser');
const Campaign = require('../../../src/models/campaign');
const Placement = require('../../../src/models/placement');
const Publisher = require('../../../src/models/publisher');
const Contact = require('../../../src/models/contact');
const fixtures = require('../../../src/fixtures');
const { testTrimmedField, testUniqueField, testRequiredField } = require('../../utils');

const generateCampaign = (advertiser, placement, internalContact, externalContact) => {
  return fixtures(Campaign, 1, {
    advertiserId: () => advertiser.id,
    placementId: () => placement.id,
    internalContactIds: [
      internalContact.id
    ],
    externalContactIds: [
      externalContact.id
    ],
  }).one();
};

describe('schema/campaign', function() {
  let advertiser;
  let placement;
  let internalContact;
  let externalContact;
  before(async function() {
    await Advertiser.remove({});
    await Campaign.remove({});
    await Placement.remove({});
    await Publisher.remove({});
    await Contact.remove({});
    internalContact = await fixtures(Contact, 1).one().save();
    externalContact = await fixtures(Contact, 1).one().save();
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
    await Contact.remove({});
  });

  it('should successfully save.', async function() {
    const campaign = generateCampaign(advertiser, placement, internalContact, externalContact);
    await expect(campaign.save()).to.be.fulfilled;
  });

  describe('#name', function() {
    let campaign;
    beforeEach(function() {
      campaign = generateCampaign(advertiser, placement, internalContact, externalContact);
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

  describe('#hash', function() {
    let campaign;
    beforeEach(function() {
      campaign = generateCampaign(advertiser, placement, internalContact, externalContact);
    });
    [null, undefined, ''].forEach((value) => {
      it(`should be required and be rejected when the value is '${value}'`, function() {
        return testRequiredField(Campaign, campaign, 'hash', value);
      });
    });
    [1234, '1234', 'some-random-thing'].forEach((value) => {
      it(`should be a uuidv4 and be rejected when the value is '${value}'`, async function() {
        campaign.set('hash', value);
        await expect(campaign.save()).to.be.rejectedWith(Error, /Invalid campaign hash/i);
      });
    });
  });

  describe('#advertiserId', function() {
    let campaign;
    beforeEach(function() {
      campaign = generateCampaign(advertiser, placement, internalContact, externalContact);
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
      campaign = generateCampaign(advertiser, placement, internalContact, externalContact);
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
      campaign = generateCampaign(advertiser, placement, internalContact, externalContact);
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

  describe('#notify', function() {
    let campaign;
    beforeEach(function() {
      campaign = generateCampaign(advertiser, placement, internalContact, externalContact);
    });

    it('should be an object', function() {
      expect(campaign.get('notify')).to.be.an('object');
      expect(campaign.get('notify.internal')).to.be.an('array');
      expect(campaign.get('notify.external')).to.be.an('array');
    })

  });

});
