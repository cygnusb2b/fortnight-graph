const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const client = require('../../src/redis/client');

chai.use(chaiAsPromised);
const expect = chai.expect;

const { REDIS_DSN } = process.env;

describe('redis/client', function() {
  it('should return an object with the required properties.', function(done) {
    expect(client).to.be.an('object');
    expect(client).to.have.property('create').and.be.a('function');
    done();
  });
  describe('#create', function() {
    it('should return a successful promise when connection string is valid.', function() {
      const promise = client.create({ url: REDIS_DSN }).then((c) => {
        c.quit();
        return c;
      });
      return expect(promise).to.be.fulfilled;
    });
    it('should return a rejected promise when connection string is invalid.', function() {
      const promise = client.create({ url: 'foo' });
      return expect(promise).to.be.rejectedWith(Error, 'Redis connection to foo failed - connect ENOENT foo');
    });
  });
});
