require('../../connections');
const moment = require('moment');
const AnalyticsBot = require('../../../src/models/analytics/bot');
const CampaignPlacementRepo = require('../../../src/repositories/campaign/placement');

const sandbox = sinon.createSandbox();

describe('schema/analytics/bot', function() {

  describe('#aggregateSave', function() {
    let date;
    beforeEach(async function() {
      // GMT Thursday, March 1, 2018 9:18:46.481 PM
      // Thursday, March 1, 2018 3:18:46.481 PM GMT-06:00
      date = new Date(1519939126481);
      await AnalyticsBot.remove();
    });
    afterEach(async function() {
      await AnalyticsBot.remove();
    });

    it('should reject when invalid.', async function() {
      const request = new AnalyticsBot();
      await expect(request.aggregateSave()).to.be.rejectedWith(Error, /validation failed/i);
    });

    it('should save/upsert an existing request, when cid is empty.', async function() {
      const request1 = new AnalyticsBot({
        e: 'request',
        value: 'GoogleBot',
        last: date,
        hash: '7140bcc287f41c8e4aced0d1f1dbf7ab',
      });
      const request2 = new AnalyticsBot({
        e: 'request',
        value: 'GoogleBot',
        last: new Date(1519939260000),
        hash: '7140bcc287f41c8e4aced0d1f1dbf7ab',
      });
      await expect(request1.aggregateSave()).to.be.fulfilled;
      await expect(request2.aggregateSave()).to.be.fulfilled;

      const result = await AnalyticsBot.findOne({ e: request1.e, value: request1.value, cid: request1.cid, hash: request1.hash, day: request1.day });

      expect(result.hash).to.equal('7140bcc287f41c8e4aced0d1f1dbf7ab');
      expect(result.e).to.equal('request');
      expect(result.value).to.equal('GoogleBot');
      expect(result.n).to.equal(2);
      expect(result.cid).to.be.null;
      expect(result.day.toUTCString()).to.equal('Thu, 01 Mar 2018 00:00:00 GMT');
      expect(result.last.toUTCString()).to.equal('Thu, 01 Mar 2018 21:21:00 GMT');

    });

    it('should save/upsert an existing request, when cid is not null (and an existing is null).', async function() {
      const initial = new AnalyticsBot({
        e: 'request',
        value: 'GoogleBot',
        last: date,
        hash: '7140bcc287f41c8e4aced0d1f1dbf7ab',
      });
      await expect(initial.aggregateSave()).to.be.fulfilled;

      const request1 = new AnalyticsBot({
        e: 'request',
        value: 'GoogleBot',
        cid: '5a9ef504a4cbe7963db471aa',
        last: date,
        hash: '7140bcc287f41c8e4aced0d1f1dbf7ab',
      });

      const request2 = new AnalyticsBot({
        e: 'request',
        value: 'GoogleBot',
        cid: '5a9ef504a4cbe7963db471aa',
        last: new Date(1519939260000),
        hash: '7140bcc287f41c8e4aced0d1f1dbf7ab',
      });
      await expect(request1.aggregateSave()).to.be.fulfilled;
      await expect(request2.aggregateSave()).to.be.fulfilled;

      const result = await AnalyticsBot.findOne({ e: request1.e, value: request1.value, cid: request1.cid, hash: request1.hash, hour: request1.hour });

      expect(result.id).to.not.equal(initial.id);
      expect(result.hash).to.equal('7140bcc287f41c8e4aced0d1f1dbf7ab');
      expect(result.e).to.equal('request');
      expect(result.value).to.equal('GoogleBot');
      expect(result.n).to.equal(2);
      expect(result.cid.toString()).to.equal('5a9ef504a4cbe7963db471aa');
      expect(result.day.toUTCString()).to.equal('Thu, 01 Mar 2018 00:00:00 GMT');
      expect(result.last.toUTCString()).to.equal('Thu, 01 Mar 2018 21:21:00 GMT');

    });
  });

});
