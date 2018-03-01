require('../../connections');
const AnalyticsRequest = require('../../../src/models/analytics/request');
const CampaignPlacementRepo = require('../../../src/repositories/campaign/placement');

const sandbox = sinon.createSandbox();

describe('schema/analytics/request', function() {

  describe('.kv', function() {
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

  describe('.hour', function() {
    it('should remove the milli, seconds, and minutes from the date.', function(done) {
      const request = new AnalyticsRequest();
      request.hour = new Date();

      expect(request.hour.getMilliseconds()).to.equal(0);
      expect(request.hour.getSeconds()).to.equal(0);
      expect(request.hour.getMinutes()).to.equal(0);

      done();
    });
  });

  describe('.hashObj', function() {
    it('should return the object to hash.', function(done) {
      const request = new AnalyticsRequest({
        pid: '5410f52389ce2f8354ac8e2e',
        kv: { foo: 'bar' },
        hour: new Date(),
      });
      request.kv = { bar: 'foo' };

      expect(request.hashObj).to.deep.equal({
        pid: '5410f52389ce2f8354ac8e2e',
        kv: { bar: 'foo' },
      });
      done();
    });
  });

  describe('#validate', function() {
    it('should throw an error when the model is invalid.', async function() {
      const request = new AnalyticsRequest();
      await expect(request.validate()).to.be.rejectedWith(Error, /validation failed/i);
    });
  });

  describe('#buildHash', function() {
    it('should create the hash and successfully validate.', async function() {
      const request = new AnalyticsRequest({
        pid: '5410f52389ce2f8354ac8e2e',
        kv: { foo: 'bar' },
        hour: new Date(),
      });
      request.buildHash();

      expect(request.hash).to.be.a('string').that.matches(/[a-f0-9]{32}/);
      await expect(request.validate()).to.be.fulfilled;
    });
  });

  describe('#aggregateSave', function() {
    before(async function() {
      await AnalyticsRequest.remove();
    });
    after(async function() {
      await AnalyticsRequest.remove();
    });

    it('should reject when invalid.', async function() {
      const request = new AnalyticsRequest();
      await expect(request.aggregateSave()).to.be.rejectedWith(Error, /validation failed/i);
    });

    it('should save/upsert.', async function() {
      const date = new Date(1519939126481);
      const request = new AnalyticsRequest({
        hour: date,
        pid: '5410f52389ce2f8354ac8e2e',
        kv: { foo: 'bar' },
      });
      await expect(request.aggregateSave()).to.be.fulfilled;
      const result = await AnalyticsRequest.findOne({ hash: request.hash });
      expect(result.hash).to.equal(request.hash);
      expect(result.n).to.equal(1);
      expect(result.hour.getMinutes()).to.equal(0);
      expect(result.last.getMilliseconds()).to.be.gt(0);
      expect(result.hour.getHours()).to.equal(date.getHours());
    });
    it('should save/upsert and increment.', async function() {
      const date = new Date(1519939126481);
      const request = new AnalyticsRequest({
        hour: date,
        pid: '5410f52389ce2f8354ac8e2e',
        kv: { foo: 'bar' },
      });
      await expect(request.aggregateSave()).to.be.fulfilled;
      const result = await AnalyticsRequest.findOne({ hash: request.hash });
      expect(result.hash).to.equal(request.hash);
      expect(result.n).to.equal(2);
    });
  });

});
