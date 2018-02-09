const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const Advertiser = require('../../src/models/advertiser');
const Campaign = require('../../src/models/campaign');
const fixtures = require('../../src/fixtures');
const { testTrimmedField, testUniqueField, testRequiredField } = require('../utils');

chai.use(chaiAsPromised);
const expect = chai.expect;

describe('models/campaign', function() {
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

  describe('#name', function() {
    let campaign;
    beforeEach(function() {
      campaign = fixtures(Campaign, 1, {
        advertiserId: () => advertiser.id,
        creatives: () => [],
      }).one();
    });
    it('should be trimmed.', function() {
      return testTrimmedField(Campaign, campaign, 'name');
    });
    it('should be required', function() {
      return testRequiredField(Campaign, campaign, 'name');
    });
  });

});
