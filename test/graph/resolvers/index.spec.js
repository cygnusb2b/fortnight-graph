require('../../connections');
const { graphql } = require('./utils');
const ImageRepo = require('../../../src/repositories/image');
const sandbox = sinon.createSandbox();
const PlacementRepo = require('../../../src/repositories/placement');

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

    describe('autocomplete', function() {
      let placement;
      before(async function() {
        const results = await PlacementRepo.seed();
        placement = await results.one();
      });

      const type = 'placement';
      const field = 'name';
      const query = `
      query Autocomplete($input: AutocompleteInput!) {
        autocomplete(input: $input) {
          id
          name
        }
      }
      `;

      it('should reject if type is not specified.', async function() {
        const input = {
          term: 'test',
          field
        };
        const variables = { input };
        await expect(graphql({ query, variables, key: 'autocomplete', loggedIn: true })).to.be.rejectedWith(Error, /Field value\.type of required type String! was not provided/i);
      });
      it('should reject if field is not specified.', async function() {
        const input = {
          term: 'test',
          type
        };
        const variables = { input };
        await expect(graphql({ query, variables, key: 'autocomplete', loggedIn: true })).to.be.rejectedWith(Error, /Field value\.field of required type String! was not provided/i);
      });
      it('should always return an array', async function() {
        const input = { term: 'this should never be found unless someone is dumb', type, field };
        const variables = { input };
        const promise = graphql({ query, variables, key: 'autocomplete', loggedIn: true })
        await expect(promise).to.eventually.be.an('array');
      });
      it('should return the expected placement', async function() {
        const { id, name } = placement;
        const input = { term: name, type, field };
        const variables = { input };
        const promise = graphql({ query, variables, key: 'autocomplete', loggedIn: true })
        await expect(promise).to.eventually.be.an('array').that.deep.includes({ id, name });
      });
      it('should allow partial searches', async function() {
        const { id, name } = placement;
        const term = name.substr(0, 3);
        const input = { term, type, field };
        const variables = { input };
        const promise = graphql({ query, variables, key: 'autocomplete', loggedIn: true })
        await expect(promise).to.eventually.be.an('array').that.deep.includes({ id, name });
      });
      it('should allow case-insensitive searches', async function() {
        const { id, name } = placement;
        const term = name.toUpperCase();
        const input = { term, type, field };
        const variables = { input };
        const promise = graphql({ query, variables, key: 'autocomplete', loggedIn: true })
        await expect(promise).to.eventually.be.an('array').that.deep.includes({ id, name });
      });
    });
  });
});
