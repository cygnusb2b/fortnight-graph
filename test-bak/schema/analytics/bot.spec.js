require('../../connections');
const moment = require('moment');
const AnalyticsBot = require('../../../src/models/analytics/bot');

const sandbox = sinon.createSandbox();

describe('schema/analytics/bot', function() {

  describe('.hash', function() {
    ['', null, undefined].forEach((value) => {
      it(`should be required and reject when the value is '${value}'`, async function() {
        const request = new AnalyticsBot({
          e: 'request',
          value: 'GoogleBoot',
          last: new Date(),
          hash: value,
        });
        await expect(request.validate()).to.be.rejectedWith(Error, /Path `hash` is required/i);
      });
    });
    it('should fail validation when not an MD5.', async function() {
      const request = new AnalyticsBot({
        e: 'request',
        value: 'GoogleBoot',
        last: new Date(),
        hash: 'abc345',
      });
      await expect(request.validate()).to.be.rejectedWith(Error, /Invalid hash value for/i);
    });
    it('should successfully validate when an MD5.', async function() {
      const request = new AnalyticsBot({
        e: 'request',
        value: 'GoogleBoot',
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
      await AnalyticsBot.remove();
    });
    afterEach(async function() {
      await AnalyticsBot.remove();
    });
    ['', null, undefined, {}, []].forEach((value) => {
      it(`should not set date when value is '${value}'`, function(done) {
        const request = new AnalyticsBot();
        request.last = value;
        expect(request.last).to.be.undefined;
        done();
      });
    });
    ['', null, undefined, {}, []].forEach((value) => {
      it(`should be required and reject when the value is '${value}'`, async function() {
        const request = new AnalyticsBot({
          e: 'request',
          value: 'GoogleBoot',
          last: value,
          day: new Date(),
          hash: '7140bcc287f41c8e4aced0d1f1dbf7ab',
        });
        await expect(request.validate()).to.be.rejectedWith(Error, /Path `last` is required/i);
      });
    });
  });

  describe('.day', function() {
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
    ['', null, undefined, {}, []].forEach((value) => {
      it(`should not set date when value is '${value}'`, function(done) {
        const request = new AnalyticsBot();
        request.day = value;
        expect(request.day).to.be.undefined;
        done();
      });
    });
    ['', null, undefined, {}, []].forEach((value) => {
      it(`should be required and reject when the value is '${value}'`, async function() {
        const request = new AnalyticsBot({
          e: 'request',
          value: 'GoogleBoot',
          last: new Date(),
          hash: '7140bcc287f41c8e4aced0d1f1dbf7ab',
        });
        request.day = value;
        await expect(request.validate()).to.be.rejectedWith(Error, /Path `day` is required/i);
      });
    });
    it('should set the date and reset to the start of the hour.', function(done) {
      const request = new AnalyticsBot();
      request.day = date;
      expect(request.day.toUTCString()).to.equal('Thu, 01 Mar 2018 00:00:00 GMT');
      done();
    });
    it('should not manipulate the incoming date value.', function(done) {
      const request = new AnalyticsBot();
      request.day = date;
      expect(request.day.toUTCString()).to.equal('Thu, 01 Mar 2018 00:00:00 GMT');
      expect(date.getTime()).to.equal(1519939126481);
      done();
    });
    it('save and once retrieved return the correct date.', async function() {
      const request = new AnalyticsBot({
        e: 'request',
        value: 'GoogleBoot',
        day: date,
        last: date,
        hash: '7140bcc287f41c8e4aced0d1f1dbf7ab',
      });
      const promise = request.save();
      await expect(promise).to.be.fulfilled;
      const saved = await promise;

      expect(saved.day.toUTCString()).to.equal('Thu, 01 Mar 2018 00:00:00 GMT');

      const result = await AnalyticsBot.findOne({ _id: saved.id });
      expect(result.day.toUTCString()).to.equal('Thu, 01 Mar 2018 00:00:00 GMT');
    });

    it('should be settable from the last property', function(done) {
      const request = new AnalyticsBot({
        last: date,
      });

      expect(request.day.toUTCString()).to.equal('Thu, 01 Mar 2018 00:00:00 GMT');
      expect(request.last.toUTCString()).to.equal('Thu, 01 Mar 2018 21:18:46 GMT');
      done();
    });

    it('should be settable from the last property, and save/retrieve properly.', async function() {
      const request = new AnalyticsBot({
        e: 'request',
        value: 'GoogleBoot',
        last: date,
        hash: '7140bcc287f41c8e4aced0d1f1dbf7ab',
      });

      const promise = request.save();
      await expect(promise).to.be.fulfilled;
      const saved = await promise;

      expect(saved.day.toUTCString()).to.equal('Thu, 01 Mar 2018 00:00:00 GMT');
      expect(saved.last.toUTCString()).to.equal('Thu, 01 Mar 2018 21:18:46 GMT');

      const result = await AnalyticsBot.findOne({ _id: saved.id });
      expect(result.day.toUTCString()).to.equal('Thu, 01 Mar 2018 00:00:00 GMT');
      expect(result.last.toUTCString()).to.equal('Thu, 01 Mar 2018 21:18:46 GMT');
    });
  });

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

    it('should save/upsert an existing request, when bot value is empty.', async function() {
      const request1 = new AnalyticsBot({
        e: 'request',
        cid: '5aa153bf4795e6000122d825',
        last: date,
        hash: '7140bcc287f41c8e4aced0d1f1dbf7ab',
      });
      const request2 = new AnalyticsBot({
        e: 'request',
        cid: '5aa153bf4795e6000122d825',
        last: new Date(1519939260000),
        hash: '7140bcc287f41c8e4aced0d1f1dbf7ab',
      });
      await expect(request1.aggregateSave()).to.be.fulfilled;
      await expect(request2.aggregateSave()).to.be.fulfilled;

      const result = await AnalyticsBot.findOne({ e: request1.e, value: request1.value, cid: request1.cid, hash: request1.hash, day: request1.day });

      expect(result.hash).to.equal('7140bcc287f41c8e4aced0d1f1dbf7ab');
      expect(result.e).to.equal('request');
      expect(result.cid.toString()).to.equal('5aa153bf4795e6000122d825');
      expect(result.value).to.be.null;
      expect(result.n).to.equal(2);
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
