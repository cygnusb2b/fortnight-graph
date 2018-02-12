const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const Advertiser = require('../../src/models/advertiser');
const fixtures = require('../../src/fixtures');
const { testTrimmedField, testUniqueField, testRequiredField } = require('../utils');

chai.use(chaiAsPromised);
const expect = chai.expect;

const generateAdvertiser = () => fixtures(Advertiser, 1).one();

describe('models/advertiser', function() {
  before(function() {
    return Advertiser.remove();
  });
  after(function() {
    return Advertiser.remove();
  });
  it('should successfully save.', async function() {
    const advertiser = generateAdvertiser();
    await expect(advertiser.save()).to.be.fulfilled;
  });

  describe('#name', function() {
    let advertiser;
    beforeEach(function() {
      advertiser = generateAdvertiser();
    });
    it('should be trimmed.', function() {
      return testTrimmedField(Advertiser, advertiser, 'name');
    });
    const values = ['', null, undefined];
    values.forEach((value) => {
      it(`should be required and be rejected when the value is '${value}'`, function() {
        return testRequiredField(Advertiser, advertiser, 'name', value);
      });
    });
    it('should be unique.', function() {
      const another = generateAdvertiser();
      return testUniqueField(Advertiser, advertiser, another, 'name');
    });
  });
});
