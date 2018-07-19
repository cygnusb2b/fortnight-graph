require('../../connections');
const moment = require('moment');
const AnalyticsView = require('../../../src/models/analytics/view');

const sandbox = sinon.createSandbox();

describe('schema/analytics/view', function() {

  describe('#aggregateSave', function() {
    let date;
    beforeEach(async function() {
      // GMT Thursday, March 1, 2018 9:18:46.481 PM
      // Thursday, March 1, 2018 3:18:46.481 PM GMT-06:00
      date = new Date(1519939126481);
      await AnalyticsView.remove();
    });
    afterEach(async function() {
      await AnalyticsView.remove();
    });

    it('should reject when invalid.', async function() {
      const request = new AnalyticsView();
      await expect(request.aggregateSave()).to.be.rejectedWith(Error, /validation failed/i);
    });

    it('should save/upsert an existing request, when cid is empty.', async function() {
      const request1 = new AnalyticsView({
        last: date,
        hash: '7140bcc287f41c8e4aced0d1f1dbf7ab',
      });
      const request2 = new AnalyticsView({
        last: new Date(1519939260000),
        hash: '7140bcc287f41c8e4aced0d1f1dbf7ab',
      });
      await expect(request1.aggregateSave()).to.be.fulfilled;
      await expect(request2.aggregateSave()).to.be.fulfilled;

      const result = await AnalyticsView.findOne({ cid: request1.cid, hash: request1.hash, hour: request1.hour });

      expect(result.hash).to.equal('7140bcc287f41c8e4aced0d1f1dbf7ab');
      expect(result.n).to.equal(2);
      expect(result.cid).to.be.null;
      expect(result.hour.toUTCString()).to.equal('Thu, 01 Mar 2018 21:00:00 GMT');
      expect(result.last.toUTCString()).to.equal('Thu, 01 Mar 2018 21:21:00 GMT');

    });

    it('should save/upsert an existing request, when cid is not null (and an existing is null).', async function() {
      const initial = new AnalyticsView({
        last: date,
        hash: '7140bcc287f41c8e4aced0d1f1dbf7ab',
      });
      await expect(initial.aggregateSave()).to.be.fulfilled;

      const request1 = new AnalyticsView({
        cid: '5a9ef504a4cbe7963db471aa',
        last: date,
        hash: '7140bcc287f41c8e4aced0d1f1dbf7ab',
      });

      const request2 = new AnalyticsView({
        cid: '5a9ef504a4cbe7963db471aa',
        last: new Date(1519939260000),
        hash: '7140bcc287f41c8e4aced0d1f1dbf7ab',
      });
      await expect(request1.aggregateSave()).to.be.fulfilled;
      await expect(request2.aggregateSave()).to.be.fulfilled;

      const result = await AnalyticsView.findOne({ cid: request1.cid, hash: request1.hash, hour: request1.hour });

      expect(result.id).to.not.equal(initial.id);
      expect(result.hash).to.equal('7140bcc287f41c8e4aced0d1f1dbf7ab');
      expect(result.n).to.equal(2);
      expect(result.cid.toString()).to.equal('5a9ef504a4cbe7963db471aa');
      expect(result.hour.toUTCString()).to.equal('Thu, 01 Mar 2018 21:00:00 GMT');
      expect(result.last.toUTCString()).to.equal('Thu, 01 Mar 2018 21:21:00 GMT');

    });
  });

});
