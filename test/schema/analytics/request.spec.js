require('../../connections');
const AnalyticsRequest = require('../../../src/models/analytics/request');
const CampaignPlacementRepo = require('../../../src/repositories/campaign/placement');

const sandbox = sinon.createSandbox();

describe('schema/analytics/request', function() {

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
        last: date,
        hash: '660095791f5d2264447ea840b08b1bd7',
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
        last: date,
        hash: '660095791f5d2264447ea840b08b1bd7',
      });
      await expect(request.aggregateSave()).to.be.fulfilled;
      const result = await AnalyticsRequest.findOne({ hash: request.hash });
      expect(result.hash).to.equal(request.hash);
      expect(result.n).to.equal(2);
    });
  });

});
