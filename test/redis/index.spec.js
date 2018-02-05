const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const sinon = require('sinon');
const redis = require('../../src/redis');
const client = require('../../src/redis/client');

chai.use(chaiAsPromised);
const expect = chai.expect;
const sandbox = sinon.createSandbox();

const testObject = (value) => {
  expect(redis).to.be.an('object');
  expect(redis).to.respondTo('use');
  expect(redis).to.respondTo('get');
};

const fakeClient = () => Promise.resolve();

describe('redis/index', function() {
  it('should export an object.', function(done) {
    testObject(redis);
    done();
  });
  describe('#get', function() {
    beforeEach(function() {
      sandbox.stub(client, 'create').callsFake(fakeClient);
    });
    afterEach(function() {
      sandbox.restore();
    });

    it('should throw an error if the requested client is not found.', function(done) {
      expect(() => redis.get('test')).to.throw(Error, 'Redis client test does not exist!');
      done();
    });
    it('should return a client promise.', async () => {
      redis.use('baz');
      await expect(redis.get('baz')).to.be.fulfilled;
    });
  });
  describe('#use', function() {
    beforeEach(function() {
      sandbox.stub(client, 'create').callsFake(fakeClient);
    });
    afterEach(function() {
      sandbox.restore();
    });

    it('should throw an error if a client name is not provided.', function(done) {
      const names = ['', null, false, undefined, 0];
      names.forEach((name) => {
        expect(() => redis.use(name)).to.throw(Error, 'The Redis client name must be specified!');
      });
      done();
    });
    it('should throw an error when a client name is already in use.', function(done) {
      redis.use('foo');
      expect(() => redis.use('foo')).to.throw(Error, 'Redis client foo already exists!');
      done();
    });
    it('should return an instance of itself when a client is added.', function(done) {
      const res = redis.use('bar');
      testObject(res);
      done();
    });
  });
});
