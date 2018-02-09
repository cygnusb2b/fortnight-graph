const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const Advertiser = require('../../src/models/advertiser');
const fixtures = require('../../src/fixtures');
const { testTrimmedField, testUniqueField, testRequiredField } = require('../utils');

chai.use(chaiAsPromised);
const expect = chai.expect;

describe('models/advertiser', function() {
  before(function() {
    return Advertiser.remove();
  });
  after(function() {
    return Advertiser.remove();
  });

  describe('#name', function() {
    let advertiser;
    beforeEach(function() {
      advertiser = fixtures(Advertiser, 1).one();
    });
    it('should be trimmed.', function() {
      return testTrimmedField(Advertiser, advertiser, 'name');
    });
    it('should be required', function() {
      return testRequiredField(Advertiser, advertiser, 'name');
    });
    it('should be unique.', function() {
      const another = fixtures(Advertiser, 1).one();
      return testUniqueField(Advertiser, advertiser, another, 'name');
    });
  });

});
