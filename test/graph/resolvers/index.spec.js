require('../../connections');
const { graphql } = require('./utils');
const sandbox = sinon.createSandbox();

describe('graph/resolvers', function() {
  describe('Query', function() {

    describe('ping', function() {
      const query = `
        query Ping {
          ping
        }
      `;
      it('should pong.', async function() {
        const data = await graphql({ query, key: 'ping' });
        expect(data).to.equal('pong');
      });
    });

    describe('signImageUpload', function() {
      before(function() {
        sandbox.stub(ImageRepo, 'signUpload').resolves({
          url: 'https://someurl.com',
          key: 'some-path/filename.jpg',
          expires: 120,
        });
      });
      after(function() {
        sandbox.restore();
      });
      const query = `
        query SignImageUpload($input: ImageUploadInput!) {
          signImageUpload(input: $input) {
            url
            key
            expires
          }
        }
      `;
      it('should return a signed upload URL.', async function() {
        const input = {
          name: 'some-file-name.jpg',
          type: 'image/jpeg',
          size: 37,
        };

        const variables = { input };
        const data = await graphql({ key: 'signImageUpload', query, variables });
        expect(data).to.be.an('object').with.all.keys('url', 'key', 'expires');
      });
    });

  });
});
