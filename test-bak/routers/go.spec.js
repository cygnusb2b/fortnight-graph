require('../connections');
const app = require('../../src/app');

describe('routers/go', function() {
  it('should return a 301 and redirect internally.', function(done) {
    request(app)
      .get('/go/some-token-value')
      .expect(301)
      .expect((res) => {
        expect(res.get('location').endsWith('/redir/some-token-value')).to.equal(true);
      })
      .end(done);
  });
});
