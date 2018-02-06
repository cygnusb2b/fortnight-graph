const mongoose = require('mongoose');
const redis = require('../src/redis');
const index = require('../src/index');

after(function() {
  // Globally quit redis.
  redis.quit();
  // Globally disconnect mongoose connections.
  mongoose.disconnect();
});

describe('index', function() {
  it('should load.', function(done) {
    done();
  });
  after(function() {
    // Close the app.
    index.close();
  });
});
