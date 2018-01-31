const expect = require('chai').expect;
const redis = require('../../src/redis');

describe('redis/index', function() {
  it('should export an object.', function(done) {
    expect(redis).to.be.an('object');
    expect(redis).to.respondTo('use');
    expect(redis).to.respondTo('get');
    done();
  });
  describe('#get', function() {
    it('should throw an error if the requested client is not found.', function(done) {
      expect(() => redis.get('foo')).to.throw(Error, 'Redis client foo does not exist!');
      done();
    });
  });
  describe('#use', function() {
    it('should throw an error if a client name is not provided.', function(done) {
      const names = ['', null, false, undefined, 0];
      names.forEach((name) => {
        expect(() => redis.use(name)).to.throw(Error, 'The Redis client name must be specified!');
      });
      done();
    });
  });
});
