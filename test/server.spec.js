const expect = require('chai').expect;
const server = require('../src/server');

describe('server', function() {
  it('should return an object.', function(done) {
    expect(server).to.be.an('object');
    expect(server).to.have.keys(['app', 'redis', 'mongoose']);
    done();
  });
});
