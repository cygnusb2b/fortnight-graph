const expect = require('chai').expect;
const request = require('supertest');
const UserRepo = require('../../src/repositories/user');
const { buildGraphQuery, testNoAuth, testBadAuth, expectGraphError, GRAPH_ENDPOINT } = require('../utils');

const { app } = require('../../src/server');
const router = require('../../src/routers/graph');

describe('routers/graph', function() {
  let user;
  let token;
  before(async function() {
    // Create a user and get a session token.
    user = UserRepo.generate().one();
    const cleartext = user.password;
    await user.save();
    const { session } = await UserRepo.login(user.email, cleartext);
    token = session.token;
  });
  after(function() {
    // Delete the user.
    return UserRepo.removeByEmail(user.email);
  });

  it('should export a router function.', function(done) {
    expect(router).to.be.a('function');
    expect(router).itself.to.respondTo('use');
    done();
  });
  describe('query Advertiser($input: ModelIdInput!)', function() {
    const query = `
      query Advertiser($input: ModelIdInput!) {
        advertiser(input: $input) {
          id
          name
          createdAt
          updatedAt
        }
      }
    `;

    it('should return an error when not authenticated.', function(done) {
      const variables = { input: { id: '1234' } };
      const body = buildGraphQuery(query, variables);
      testNoAuth(request, app, body, done);
    });
    it('should return an error when invalid auth is found.', function(done) {
      const variables = { input: { id: '1234' } };
      const body = buildGraphQuery(query, variables);
      testBadAuth(request, app, body, done);
    });
    it('should return an error when advertiser is not found.', function(done) {
      const id = '5a7b7c91a84f4c086a70bfc5';
      const variables = { input: { id } };
      const body = buildGraphQuery(query, variables);
      request(app)
        .post(GRAPH_ENDPOINT)
        .set('Authorization', `Bearer ${token}`)
        .send(body)
        .expect((res) => {
          expectGraphError(res, `No advertiser record found for ID ${id}.`)
        })
        .end(done);
      ;

    });
  });
});
