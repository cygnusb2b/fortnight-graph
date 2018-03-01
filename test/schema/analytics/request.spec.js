const AnalyticsRequest = require('../../../src/models/analytics/request');
const CampaignPlacementRepo = require('../../../src/repositories/campaign/placement');

const sandbox = sinon.createSandbox();

describe('schema/analytics/request', function() {

  describe('#kv', function() {
    beforeEach(function() {
      sandbox.spy(CampaignPlacementRepo, 'cleanTargetingVars');
    });
    afterEach(function() {
      sandbox.restore();
    });
    it('should clean the target vars when using .set()', function(done) {
      const request = new AnalyticsRequest();
      request.set('kv', { foo: 'bar' });
      sinon.assert.calledOnce(CampaignPlacementRepo.cleanTargetingVars);
      done();
    });
    it('should clean the target vars when directly setting', function(done) {
      const request = new AnalyticsRequest();
      request.kv = { foo: 'bar' };
      sinon.assert.calledOnce(CampaignPlacementRepo.cleanTargetingVars);
      done();
    });
    it('should clean the target vars when constructing.', function(done) {
      const request = new AnalyticsRequest({ kv: { foo: 'bar' } });
      sinon.assert.calledOnce(CampaignPlacementRepo.cleanTargetingVars);
      done();
    });
  });

  describe('#hour', function() {
    it('should remove the milli, seconds, and minutes from the date.', function(done) {
      const request = new AnalyticsRequest();
      request.hour = new Date();

      expect(request.hour.getMilliseconds()).to.equal(0);
      expect(request.hour.getSeconds()).to.equal(0);
      expect(request.hour.getMinutes()).to.equal(0);

      done();
    });
  });

});
