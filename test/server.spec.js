require('./connections');
const expect = require('chai').expect;
const server = require('../src/server');

describe('server', function() {
  it('should return an object.', function(done) {
    expect(server).to.be.an('object').with.keys(['app', 'redis', 'mongoose', 'elastic']);
    done();
  });
});
