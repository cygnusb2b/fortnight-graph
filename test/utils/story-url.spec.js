const storyUrl = require('../../src/utils/story-url');

describe('utils/story-url', function() {
  it('should export a function.', async function() {
    expect(storyUrl).to.be.a('function');
  });
  it('should apply the URI and path', async function() {
    expect(storyUrl('https://www.google.com', 'foo/bar')).to.equal('https://www.google.com/foo/bar');
  });
  it('should strip slashes properly', async function() {
    expect(storyUrl('https://www.google.com//', '//foo/bar/')).to.equal('https://www.google.com/foo/bar');
  });
  it('should set query parameters', async function() {
    const params = {
      foo: 'bar',
      baz: true,
    }
    expect(storyUrl('https://www.google.com', 'foo/bar//', params)).to.equal('https://www.google.com/foo/bar/?foo=bar&baz=true');
  });
  it('should not set the parameters when `params` is not an object.', async function() {
    expect(storyUrl('https://www.google.com', 'foo/bar', '1234')).to.equal('https://www.google.com/foo/bar');
  });
});
