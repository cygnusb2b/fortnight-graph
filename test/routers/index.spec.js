const loadRouters = require('../../src/routers');

describe('routers/index', function() {
  it('should be a function.', function(done) {
    expect(loadRouters).to.be.a('function');
    done();
  });
  it('should handle the appropriate routers for the app.', function(done) {
    const routers = [];
    const app = {
      use(path, router) {
        routers.push({ path, router });
      }
    };
    const expectedPaths = ['/graph', '/placement', '/t'];

    loadRouters(app);
    expect(routers.length).to.equal(expectedPaths.length);
    expectedPaths.forEach((path) => {
      const router = routers.find(router => router.path === path);
      expect(router).to.be.an('object');
      expect(expectedPaths.includes(router.path)).to.be.true;
      expect(router.router).to.be.a('function');
      expect(router.router).itself.to.respondTo('use');
    });
    done();
  });
});
