const expect = require('chai').expect;
const router = require('../../src/routers/graph');

describe('routers/graph', function() {
  it('should export a router function.', function(done) {
    expect(router).to.be.a('function');
    expect(router).itself.to.respondTo('use');
    done();
  });
});
