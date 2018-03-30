require('../../connections');
const moment = require('moment');
const AnalyticsEvent = require('../../../src/models/analytics/event');
const Utils = require('../../../src/utils');

const sandbox = sinon.createSandbox();

describe('schema/analytics/event', function() {

  describe('.uuid', function() {
    [null, undefined].forEach((value) => {
      it(`should be required and reject when the value is '${value}'`, async function() {
        const event = new AnalyticsEvent({
          e: 'request',
          uuid: value,
          pid: '5aa03a87be66ee000110c13b',
          d: new Date(),
        });
        await expect(event.validate()).to.be.rejectedWith(Error, /Path `uuid` is required/i);
      });
    });
    ['92e998a7-e596-4747-a233-09108938c8d4', '92e998a7e5964747a23309108938c8d4'].forEach((value) => {
      it(`should fulfill validation when the value is '${value}'`, async function() {
        const event = new AnalyticsEvent({
          e: 'request',
          uuid: value,
          pid: '5aa03a87be66ee000110c13b',
          d: new Date(),
        });
        await expect(event.validate()).to.be.fulfilled;
      });
    });
    it(`should reject validation when the value is '1234'`, async function() {
      const event = new AnalyticsEvent({
        e: 'request',
        uuid: '1234',
        pid: '5aa03a87be66ee000110c13b',
        d: new Date(),
      });
      await expect(event.validate()).to.be.rejectedWith(Error, /Invalid UUID for 1234/i);
    });
  });

  describe('.pid', function() {
    [null, undefined].forEach((value) => {
      it(`should be required and reject when the value is '${value}'`, async function() {
        const event = new AnalyticsEvent({
          e: 'request',
          uuid: '92e998a7-e596-4747-a233-09108938c8d4',
          pid: value,
          d: new Date(),
        });
        await expect(event.validate()).to.be.rejectedWith(Error, /Path `pid` is required/i);
      });
    });
  });

  describe('.d', function() {
    [null, undefined].forEach((value) => {
      it(`should be required and reject when the value is '${value}'`, async function() {
        const event = new AnalyticsEvent({
          e: 'request',
          uuid: '92e998a7-e596-4747-a233-09108938c8d4',
          pid: '5aa03a87be66ee000110c13b',
          d: value,
        });
        await expect(event.validate()).to.be.rejectedWith(Error, /Path `d` is required/i);
      });
    });
  });

  describe('.ua', function() {
    [null, undefined, ''].forEach((value) => {
      it(`should be set to undefined when the value is '${value}'`, async function() {
        const event = new AnalyticsEvent({
          e: 'request',
          uuid: '92e998a7-e596-4747-a233-09108938c8d4',
          pid: '5aa03a87be66ee000110c13b',
          d: new Date(),
          ua: value,
        });
        await expect(event.ua).to.be.undefined;
      });
    });
    it('should set an object when the value cannot be parsed.', async function() {
      const event = new AnalyticsEvent({
        e: 'request',
        uuid: '92e998a7-e596-4747-a233-09108938c8d4',
        pid: '5aa03a87be66ee000110c13b',
        d: new Date(),
        ua: 'some unknown ua',
      });
      await expect(event.ua).to.be.an('object');
    });
  });

  describe('.kv', function() {
    before(function() {
      sandbox.spy(Utils, 'cleanValues');
    });
    after(function() {
      sandbox.restore();
    });
    it('should clean the passed key/values.', function(done) {
      const event = new AnalyticsEvent({
        e: 'request',
        uuid: '92e998a7-e596-4747-a233-09108938c8d4',
        pid: '5aa03a87be66ee000110c13b',
        d: new Date(),
        kv: { foo: 'bar' },
      });
      sinon.assert.calledOnce(Utils.cleanValues);
      done();
    });
  });

});
