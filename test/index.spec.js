require('./connections');
const index = require('../src/index');

describe('index', function() {
  it('should load.', function(done) {
    done();
  });
  after(function() {
    // Close the app.
    index.close();
  });
});
