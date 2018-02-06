const redis = require('../src/redis');

after(function() {
  // Globally quit redis.
  redis.quit();
});
