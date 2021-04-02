const storyUrl = require('../../src/utils/story-url');
const accountService = require('../../src/services/account');

const sandbox = sinon.createSandbox();

describe('utils/story-url', function() {
  beforeEach(function() {
    sandbox.stub(accountService, 'retrieve').resolves({
      storyUri: 'https://www.google.com',
    });
  });

  afterEach(function() {
    sandbox.restore();
  });

  it('should export a function.', async function() {
    expect(storyUrl).to.be.a('function');
  });
  it('should apply the URI and path', async function() {
    expect(storyUrl({}, {})).to.eventually.equal('https://www.google.com/foo/bar');
  });
  it('should strip slashes properly', async function() {
    const publisher = {
      domainName: 'www.google.com//',
      storyPath: 'foo/bar//',
    };
    expect(storyUrl({}, publisher)).to.eventually.equal('https://www.google.com/foo/bar');
  });
  it('should set query parameters', async function() {
    const params = {
      foo: 'bar',
      baz: true,
    };
    expect(storyUrl({}, {}, params)).to.eventually.equal('https://www.google.com/foo/bar/?foo=bar&baz=true');
  });
  it('should not set the parameters when `params` is not an object.', async function() {
    expect(storyUrl({}, {}, '1234')).to.eventually.equal('https://www.google.com/foo/bar');
  });
});
