const router = require('../../src/routers/placement');

describe('routers/placement', function() {
  it('should export a router function.', function(done) {
    expect(router).to.be.a('function');
    expect(router).itself.to.respondTo('use');
    done();
  });
});
