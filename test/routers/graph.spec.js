const expect = require('chai').expect;
const request = require('supertest');
const { buildGraphQuery, testNoAuth, testBadAuth } = require('../utils');

const { app } = require('../../src/server');
const router = require('../../src/routers/graph');

describe('routers/graph', function() {
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
  });
});
