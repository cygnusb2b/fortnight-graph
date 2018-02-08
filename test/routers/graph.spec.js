const expect = require('chai').expect;
const request = require('supertest');
const UserRepo = require('../../src/repositories/user');
const AdvertiserRepo = require('../../src/repositories/advertiser');
const { buildGraphQuery, testNoAuth, testBadAuth, expectGraphError, expectGraphSuccess, parseGraphResponse, GRAPH_ENDPOINT } = require('../utils');

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
  describe('query Ping', function() {
    const query = `
      query Ping {
        ping
      }
    `;
    it('should pong!', function(done) {
      const body = buildGraphQuery(query);
      request(app)
        .post(GRAPH_ENDPOINT)
        .send(body)
        .expect(res => expectGraphSuccess(res, 'ping', 'string'))
        .expect((res) => {
          const data = parseGraphResponse(res, 'ping');
          expect(data).to.equal('pong');
        })
        .end(done);
    });
  });
  describe('query Advertiser($input: ModelIdInput!)', function() {
    let advertiser;
    before(function() {
      advertiser = AdvertiserRepo.generate().one();
      return advertiser.save();
    });
    after(function() {
      AdvertiserRepo.remove();
    });

    const query = `
      query Advertiser($input: ModelIdInput!) {
        advertiser(input: $input) {
          id
          name
          createdAt
          updatedAt
          campaigns {
            id
          }
          campaignCount
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
        .expect(res => expectGraphError(res, `No advertiser record found for ID ${id}.`))
        .end(done);
      ;
    });
    it('should return an advertiser', function(done) {
      const id = advertiser.id;
      const variables = { input: { id } };
      const body = buildGraphQuery(query, variables);
      request(app)
        .post(GRAPH_ENDPOINT)
        .set('Authorization', `Bearer ${token}`)
        .send(body)
        .expect(res => expectGraphSuccess(res, 'advertiser'))
        .end(done);
    });
  });
  describe('mutation CreateAdvertiser($input: CreateAdvertiserInput!)', function() {
    after(function() {
      AdvertiserRepo.remove();
    });
    const query = `
      mutation CreateAdvertiser($input: CreateAdvertiserInput!) {
        createAdvertiser(input: $input) {
          id
          name
          createdAt
          updatedAt
          campaigns {
            id
          }
          campaignCount
        }
      }
    `;
    it('should return an error when not authenticated.', function(done) {
      const payload = { name: 'Test 1' };
      const variables = { input: { payload } };
      const body = buildGraphQuery(query, variables);
      testNoAuth(request, app, body, done);
    });
    it('should return an error when invalid auth is found.', function(done) {
      const payload = { name: 'Test 1' };
      const variables = { input: { payload } };
      const body = buildGraphQuery(query, variables);
      testBadAuth(request, app, body, done);
    });
    it('should create an advertiser', function(done) {
      const payload = { name: 'Test 1' };
      const variables = { input: { payload } };
      const body = buildGraphQuery(query, variables);

      request(app)
        .post(GRAPH_ENDPOINT)
        .set('Authorization', `Bearer ${token}`)
        .send(body)
        .expect(res => expectGraphSuccess(res, 'createAdvertiser'))
        .end(done);
    });
  });
  describe('mutation UpdateAdvertiser($input: UpdateAdvertiserInput!)', function() {
    let advertiser;
    before(function() {
      advertiser = AdvertiserRepo.generate().one();
      return advertiser.save();
    });
    after(function() {
      AdvertiserRepo.remove();
    });
    const query = `
      mutation UpdateAdvertiser($input: UpdateAdvertiserInput!) {
        updateAdvertiser(input: $input) {
          id
          name
          createdAt
          updatedAt
          campaigns {
            id
          }
          campaignCount
        }
      }
    `;
    it('should return an error when not authenticated.', function(done) {
      const id = '1234';
      const payload = { name: 'Test 1' };
      const variables = { input: { id, payload } };
      const body = buildGraphQuery(query, variables);
      testNoAuth(request, app, body, done);
    });
    it('should return an error when invalid auth is found.', function(done) {
      const id = '1234';
      const payload = { name: 'Test 1' };
      const variables = { input: { id, payload } };
      const body = buildGraphQuery(query, variables);
      testBadAuth(request, app, body, done);
    });
    it('should return an error when advertiser is not found.', function(done) {
      const id = '5a7b7c91a84f4c086a70bfc5';
      const payload = { name: 'Test 1' };
      const variables = { input: { id, payload } };
      const body = buildGraphQuery(query, variables);
      request(app)
        .post(GRAPH_ENDPOINT)
        .set('Authorization', `Bearer ${token}`)
        .send(body)
        .expect(res => expectGraphError(res, `Unable to update advertiser: no record was found for ID '${id}'`))
        .end(done);
      ;
    });
    it('should update the advertiser', function(done) {
      const id = advertiser.id;
      const payload = { name: 'This is updated!' };
      const variables = { input: { id, payload } };
      const body = buildGraphQuery(query, variables);

      request(app)
        .post(GRAPH_ENDPOINT)
        .set('Authorization', `Bearer ${token}`)
        .send(body)
        .expect(res => expectGraphSuccess(res, 'updateAdvertiser'))
        .expect((res) => {
          const data = parseGraphResponse(res, 'updateAdvertiser');
          expect(data.name).to.equal(payload.name);
        })
        .end(done);
    });
  });
});
