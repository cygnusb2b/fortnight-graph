require('../../connections');
const moment = require('moment');
const AnalyticsRequest = require('../../../src/models/analytics/request');
const CampaignPlacementRepo = require('../../../src/repositories/campaign/placement');

const sandbox = sinon.createSandbox();

describe('schema/analytics/request', function() {

  describe('.hash', function() {
    ['', null, undefined].forEach((value) => {
      it(`should be required and reject when the value is '${value}'`, async function() {
        const request = new AnalyticsRequest({
          last: new Date(),
          hash: value,
        });
        await expect(request.validate()).to.be.rejectedWith(Error, /Path `hash` is required/i);
      });
    });
    it('should fail validation when not an MD5.', async function() {
      const request = new AnalyticsRequest({
        last: new Date(),
        hash: 'abc345',
      });
      await expect(request.validate()).to.be.rejectedWith(Error, /Invalid hash value for/i);
    });
    it('should successfully validate when an MD5.', async function() {
      const request = new AnalyticsRequest({
        last: new Date(),
        hash: '7140bcc287f41c8e4aced0d1f1dbf7ab',
      });
      await expect(request.validate()).to.be.fulfilled;
    });
  });

  describe('.last', function() {
    let date;
    beforeEach(async function() {
      // GMT Thursday, March 1, 2018 9:18:46.481 PM
      // Thursday, March 1, 2018 3:18:46.481 PM GMT-06:00
      date = new Date(1519939126481);
      await AnalyticsRequest.remove();
    });
    afterEach(async function() {
      await AnalyticsRequest.remove();
    });
    ['', null, undefined, {}, []].forEach((value) => {
      it(`should not set date when value is '${value}'`, function(done) {
        const request = new AnalyticsRequest();
        request.last = value;
        expect(request.last).to.be.undefined;
        done();
      });
    });
    ['', null, undefined, {}, []].forEach((value) => {
      it(`should be required and reject when the value is '${value}'`, async function() {
        const request = new AnalyticsRequest({
          last: value,
          hour: new Date(),
          hash: '7140bcc287f41c8e4aced0d1f1dbf7ab',
        });
        await expect(request.validate()).to.be.rejectedWith(Error, /Path `last` is required/i);
      });
    });
  });

  describe('.hour', function() {
    let date;
    beforeEach(async function() {
      // GMT Thursday, March 1, 2018 9:18:46.481 PM
      // Thursday, March 1, 2018 3:18:46.481 PM GMT-06:00
      date = new Date(1519939126481);
      await AnalyticsRequest.remove();
    });
    afterEach(async function() {
      await AnalyticsRequest.remove();
    });
    ['', null, undefined, {}, []].forEach((value) => {
      it(`should not set date when value is '${value}'`, function(done) {
        const request = new AnalyticsRequest();
        request.hour = value;
        expect(request.hour).to.be.undefined;
        done();
      });
    });
    ['', null, undefined, {}, []].forEach((value) => {
      it(`should be required and reject when the value is '${value}'`, async function() {
        const request = new AnalyticsRequest({
          last: new Date(),
          hash: '7140bcc287f41c8e4aced0d1f1dbf7ab',
        });
        request.hour = value;
        await expect(request.validate()).to.be.rejectedWith(Error, /Path `hour` is required/i);
      });
    });
    it('should set the date and reset to the start of the hour.', function(done) {
      const request = new AnalyticsRequest();
      request.hour = date;
      expect(request.hour.getTime()).to.equal(1519938000000);
      expect(request.hour.toUTCString()).to.equal('Thu, 01 Mar 2018 21:00:00 GMT');
      expect(request.hour.getUTCHours()).to.equal(date.getUTCHours());
      done();
    });
    it('should not manipulate the incoming date value.', function(done) {
      const request = new AnalyticsRequest();
      request.hour = date;
      expect(request.hour.getTime()).to.equal(1519938000000);
      expect(date.getTime()).to.equal(1519939126481);
      done();
    });
    it('save and once retrieved return the correct date.', async function() {
      const request = new AnalyticsRequest({
        hour: date,
        last: date,
        hash: '7140bcc287f41c8e4aced0d1f1dbf7ab',
      });
      const promise = request.save();
      await expect(promise).to.be.fulfilled;
      const saved = await promise;

      expect(saved.hour.getTime()).to.equal(1519938000000);
      expect(saved.hour.toUTCString()).to.equal('Thu, 01 Mar 2018 21:00:00 GMT');

      const result = await AnalyticsRequest.findOne({ _id: saved.id });
      expect(result.hour.getTime()).to.equal(1519938000000);
      expect(result.hour.toUTCString()).to.equal('Thu, 01 Mar 2018 21:00:00 GMT');
    });

    it('should be settable from the last property', function(done) {
      const request = new AnalyticsRequest({
        last: date,
      });

      expect(request.hour.getTime()).to.equal(1519938000000);
      expect(request.hour.toUTCString()).to.equal('Thu, 01 Mar 2018 21:00:00 GMT');

      expect(request.last.getTime()).to.equal(1519939126481);
      expect(request.last.toUTCString()).to.equal('Thu, 01 Mar 2018 21:18:46 GMT');

      done();
    });

    it('should be settable from the last property, and save/retrieve properly.', async function() {
      const request = new AnalyticsRequest({
        last: date,
        hash: '7140bcc287f41c8e4aced0d1f1dbf7ab',
      });

      const promise = request.save();
      await expect(promise).to.be.fulfilled;
      const saved = await promise;

      expect(saved.hour.getTime()).to.equal(1519938000000);
      expect(saved.hour.toUTCString()).to.equal('Thu, 01 Mar 2018 21:00:00 GMT');

      expect(saved.last.getTime()).to.equal(1519939126481);
      expect(saved.last.toUTCString()).to.equal('Thu, 01 Mar 2018 21:18:46 GMT');

      const result = await AnalyticsRequest.findOne({ _id: saved.id });
      expect(result.hour.getTime()).to.equal(1519938000000);
      expect(result.hour.toUTCString()).to.equal('Thu, 01 Mar 2018 21:00:00 GMT');

      expect(result.last.getTime()).to.equal(1519939126481);
      expect(result.last.toUTCString()).to.equal('Thu, 01 Mar 2018 21:18:46 GMT');
    });
  });

  describe('#aggregateSave', function() {
    let date;
    beforeEach(async function() {
      // GMT Thursday, March 1, 2018 9:18:46.481 PM
      // Thursday, March 1, 2018 3:18:46.481 PM GMT-06:00
      date = new Date(1519939126481);
      await AnalyticsRequest.remove();
    });
    afterEach(async function() {
      await AnalyticsRequest.remove();
    });

    it('should reject when invalid.', async function() {
      const request = new AnalyticsRequest();
      await expect(request.aggregateSave()).to.be.rejectedWith(Error, /validation failed/i);
    });
    [-1, 0, undefined, 1].forEach((num) => {
      it(`should successfully save/upsert and set n to 1 when the num arg is '${num}'.`, async function() {
        const request = new AnalyticsRequest({
          last: date,
          hash: '7140bcc287f41c8e4aced0d1f1dbf7ab',
        });
        await expect(request.aggregateSave(num)).to.be.fulfilled;
        const result = await AnalyticsRequest.findOne({ hash: request.hash, hour: request.hour });

        expect(result.hash).to.equal('7140bcc287f41c8e4aced0d1f1dbf7ab');
        expect(result.n).to.equal(1);
        expect(result.hour.toUTCString()).to.equal('Thu, 01 Mar 2018 21:00:00 GMT');
        expect(result.last.toUTCString()).to.equal('Thu, 01 Mar 2018 21:18:46 GMT');
      });
    });

    it('should save/upsert when specifying an increment', async function() {
      const request = new AnalyticsRequest({
        last: date,
        hash: '7140bcc287f41c8e4aced0d1f1dbf7ab',
      });
      await expect(request.aggregateSave(4)).to.be.fulfilled;
      const result = await AnalyticsRequest.findOne({ hash: request.hash, hour: request.hour });

      expect(result.hash).to.equal('7140bcc287f41c8e4aced0d1f1dbf7ab');
      expect(result.n).to.equal(4);
      expect(result.hour.toUTCString()).to.equal('Thu, 01 Mar 2018 21:00:00 GMT');
      expect(result.last.toUTCString()).to.equal('Thu, 01 Mar 2018 21:18:46 GMT');
    });

    it('should save/upsert an existing request.', async function() {
      const request1 = new AnalyticsRequest({
        last: date,
        hash: '7140bcc287f41c8e4aced0d1f1dbf7ab',
      });
      const request2 = new AnalyticsRequest({
        last: new Date(1519939260000),
        hash: '7140bcc287f41c8e4aced0d1f1dbf7ab',
      });
      await expect(request1.aggregateSave()).to.be.fulfilled;
      await expect(request2.aggregateSave(2)).to.be.fulfilled;

      const result = await AnalyticsRequest.findOne({ hash: request1.hash, hour: request1.hour });

      expect(result.hash).to.equal('7140bcc287f41c8e4aced0d1f1dbf7ab');
      expect(result.n).to.equal(3);
      expect(result.hour.toUTCString()).to.equal('Thu, 01 Mar 2018 21:00:00 GMT');
      expect(result.last.toUTCString()).to.equal('Thu, 01 Mar 2018 21:21:00 GMT');

    });
  });

});
