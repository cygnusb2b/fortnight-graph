require('../../connections');
const { ObjectId } = require('mongoose').Types;
const AnalyticsRequestObject = require('../../../src/models/analytics/request-object');
const CampaignPlacementRepo = require('../../../src/repositories/campaign/placement');

const sandbox = sinon.createSandbox();

describe('schema/analytics/request', function() {

  describe('.kv', function() {

    [undefined, {}, null, '', []].forEach((kv) => {
      it(`should return an empty object when the kv is '${kv}' using .set()`, function (done) {
        const request = new AnalyticsRequestObject();
        request.set('kv', kv);
        expect(request.kv).to.deep.equal({});
        done();
      });
      it(`should return an empty object when the kv is '${kv}' using direct set`, function (done) {
        const request = new AnalyticsRequestObject();
        request.kv = kv;
        expect(request.kv).to.deep.equal({});
        done();
      });
      it(`should return an empty object when the kv is '${kv}' using the constructor`, function (done) {
        const request = new AnalyticsRequestObject({ kv });
        expect(request.kv).to.deep.equal({});
        done();
      });
    });
    it(`should strip empty and non-scalar values.`, function (done) {
      const kv = { bad: '', another: null, final: undefined, obj: {}, arr: [] };
      const request = new AnalyticsRequestObject({ kv });
      expect(request.kv).to.deep.equal({});
      done();
    });
    it(`should coerce non-strings to strings.`, function (done) {
      const kv = { a: 'string', b: 0, c: false, d: 1.1, e: null, f: undefined, g: '' };
      const request = new AnalyticsRequestObject({ kv });
      expect(request.kv).to.deep.equal({ a: 'string', b: '0', c: 'false', d: '1.1' });
      done();
    });
    it(`should trim the coerced values.`, function (done) {
      const kv = { a: 'string ', b: ' string ' };
      const request = new AnalyticsRequestObject({ kv });
      expect(request.kv).to.deep.equal({ a: 'string', b: 'string' });
      done();
    });
    it(`after trimming, it should not keep empty strings.`, function (done) {
      const kv = { a: ' ', b: '     ' };
      const request = new AnalyticsRequestObject({ kv });
      expect(request.kv).to.deep.equal({});
      done();
    });

  });

  describe('.hashObj', function() {
    it('should return the object to hash.', function(done) {
      const request = new AnalyticsRequestObject({
        pid: '5410f52389ce2f8354ac8e2e',
        kv: { foo: 'bar' },
      });
      request.kv = { bar: 'foo' };

      expect(request.hashObj).to.deep.equal({
        pid: '5410f52389ce2f8354ac8e2e',
        kv: { bar: 'foo' },
      });
      done();
    });
    it('should should stringify the PID within hash.', function(done) {
      const request = new AnalyticsRequestObject({
        pid: ObjectId('5410f52389ce2f8354ac8e2e'),
        kv: { foo: 'bar' },
      });
      request.kv = { bar: 'foo' };

      expect(request.hashObj).to.deep.equal({
        pid: '5410f52389ce2f8354ac8e2e',
        kv: { bar: 'foo' },
      });
      done();
    });
  });

  describe('.hash', function() {
    before(async function() {
      await AnalyticsRequestObject.remove();
      const obj = new AnalyticsRequestObject({
        pid: '5410f52389ce2f8354ac8e2e',
        kv: { foo: 'bar' },
      });
      obj.buildHash();
      await obj.save();
    });
    after(async function() {
      await AnalyticsRequestObject.remove();
    });
    it('should be unique.', async function() {
      const obj = new AnalyticsRequestObject({
        pid: '5410f52389ce2f8354ac8e2e',
        kv: { foo: 'bar' },
      });
      obj.buildHash();
      await expect(obj.save()).to.be.rejectedWith(Error, /duplicate key/i)
    });
  });

  describe('#validate', function() {
    let obj;
    beforeEach(function() {
      obj = new AnalyticsRequestObject({
        pid: '5410f52389ce2f8354ac8e2e',
        kv: { foo: 'bar' },
      });
      obj.buildHash();
    });
    it('should throw an error when no PID is present.', async function() {
      obj.pid = undefined;
      await expect(obj.validate()).to.be.rejectedWith(Error, /Path `pid` is required/i);
    });
    it('should throw an error when no hash is present.', async function() {
      obj.hash = undefined;
      await expect(obj.validate()).to.be.rejectedWith(Error, /Path `hash` is required/i);
    });
  });

  describe('#buildHash', function() {
    it('should create the hash and successfully validate.', async function() {
      const request = new AnalyticsRequestObject({
        pid: '5410f52389ce2f8354ac8e2e',
        kv: { foo: 'bar' },
      });
      request.buildHash();

      expect(request.hash).to.be.a('string').that.matches(/[a-f0-9]{32}/);
      await expect(request.validate()).to.be.fulfilled;
    });
  });



  describe('#aggregateSave', function() {
    before(async function() {
      await AnalyticsRequestObject.remove();
    });
    after(async function() {
      await AnalyticsRequestObject.remove();
    });

    it('should reject when invalid.', async function() {
      const request = new AnalyticsRequestObject();
      await expect(request.aggregateSave()).to.be.rejectedWith(Error, /validation failed/i);
    });

    it('should save/upsert.', async function() {
      const request = new AnalyticsRequestObject({
        pid: '5410f52389ce2f8354ac8e2e',
        kv: { foo: 'bar' },
      });
      await expect(request.aggregateSave()).to.be.fulfilled;
      const result = await AnalyticsRequestObject.findOne({ hash: request.hash });
      expect(result.hash).to.equal(request.hash);
    });
    it('should save/upsert and with multiple.', async function() {
      const request = new AnalyticsRequestObject({
        pid: '5410f52389ce2f8354ac8e2e',
        kv: { foo: 'bar' },
      });
      const request2 = new AnalyticsRequestObject({
        pid: '5410f52389ce2f8354ac8e2e',
        kv: { foo: 'bar' },
      });
      await expect(request.aggregateSave()).to.be.fulfilled;
      await expect(request2.aggregateSave()).to.be.fulfilled;
      const result1 = await AnalyticsRequestObject.findOne({ hash: request.hash });
      const result2 = await AnalyticsRequestObject.findOne({ hash: request.hash });
      expect(result1.id).to.equal(result2.id);
      expect(result1.hash).to.equal(request.hash);
      expect(result2.hash).to.equal(request.hash);
    });
  });

});
