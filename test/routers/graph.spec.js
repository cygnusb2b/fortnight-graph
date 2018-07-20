require('../connections');
const bcrypt = require('bcrypt');
const app = require('../../src/app');
const router = require('../../src/routers/graph');
const UserRepo = require('../../src/repositories/user');
const User = require('../../src/models/user');
const seed = require('../../src/fixtures/seed');
const sandbox = sinon.createSandbox();

describe('routers/graph', function() {
  it('should export a router function.', function(done) {
    expect(router).to.be.a('function');
    expect(router).itself.to.respondTo('use');
    done();
  });

  const successfulResponse = (res) => {
    const { body, status } = res;
    expect(res.get('Content-Type')).to.match(/json/i);
    expect(status).to.equal(200);
    expect(body).to.be.an('object').with.property('data');
    expect(body).to.not.have.property('errors');
  };

  describe('ping', function() {
    const query = `
      query Ping {
        ping
      }
    `;
    const properBody = ({ body }) => {
      const { data } = body;
      expect(data).to.be.an('object').with.property('ping').to.equal('pong');
    };
    it('should successfully respond to POST.', function(done) {
      request(app).post('/graph').send({ query })
        .expect(successfulResponse)
        .expect(properBody)
        .end(done);
    });
    it('should successfully respond to GET.', function(done) {
      // Used merely to confirm that graph will respond to GET requests.
      request(app).get('/graph').query({ query })
      .expect(successfulResponse)
      .expect(properBody)
      .end(done);
    });
  });
  describe('currentUser', function() {
    let token;
    let user
    before(async function() {
      const hash = '$2a$04$B9nI.XF/vfcZ4AfUTvmLcOHEwxrB4o9PDb0r1f9N3x3AqSFDTME4C';
      const password = 'test-password';

      sandbox.stub(bcrypt, 'hash').resolves(hash);
      sandbox.stub(bcrypt, 'compare').withArgs(password, hash).resolves(true);

      await User.remove();
      user = await seed.users(1);
      user.set('password', password);
      await user.save();
      const { session } = await UserRepo.login(user.email, password);
      token = session.token;
    });
    after(async function() {
      sandbox.restore();
      await User.remove();
    });

    const query = `
      query CurrentUser {
        currentUser {
          id
        }
      }
    `;

    it('should successfully respond with the current user.', function(done) {
      request(app).post('/graph')
        .set('Authorization', `Bearer ${token}`)
        .send({ query })
        .expect(successfulResponse)
        .expect(({ body }) => {
          const { data } = body;
          expect(data).to.be.an('object').with.property('currentUser').deep.equal({ id: user.id });
        })
        .end(done);
    });

    it('should return a null current user when auth is invalid.', function(done) {
      request(app).post('/graph')
        .set('Authorization', `Bearer someinvalidtoken`)
        .send({ query })
        .expect(successfulResponse)
        .expect(({ body }) => {
          const { data } = body;
          expect(data).to.be.an('object').with.property('currentUser').equal(null);
        })
        .end(done);
    });
  });
});

// require('../connections');
// const app = require('../../src/app');
// const UserRepo = require('../../src/repositories/user');
// const AdvertiserRepo = require('../../src/repositories/advertiser');
// const { buildGraphQuery, testNoAuth, testBadAuth, expectGraphError, expectGraphSuccess, parseGraphResponse, GRAPH_ENDPOINT } = require('../utils');
// const { CursorType } = require('../../src/graph/custom-types');

// const router = require('../../src/routers/graph');

// describe('routers/graph', function() {
//   let user;
//   let token;
//   let cleartext;
//   before(async function() {
//     // Create a user and get a session token.
//     await UserRepo.remove();
//     user = UserRepo.generate().one();
//     cleartext = user.password;
//     await user.save();
//     const { session } = await UserRepo.login(user.email, cleartext);
//     token = session.token;
//   });
//   after(async function() {
//     // Delete the user.
//     await UserRepo.remove();
//   });

//   it('should export a router function.', function(done) {
//     expect(router).to.be.a('function');
//     expect(router).itself.to.respondTo('use');
//     done();
//   });

//   describe('query Ping', function() {
//     const query = `
//       query Ping {
//         ping
//       }
//     `;
//     it('should pong!', function(done) {
//       const body = buildGraphQuery(query);
//       request(app)
//         .post(GRAPH_ENDPOINT)
//         .send(body)
//         .expect(res => expectGraphSuccess(res, 'ping', 'string'))
//         .expect((res) => {
//           const data = parseGraphResponse(res, 'ping');
//           expect(data).to.equal('pong');
//         })
//         .end(done);
//     });
//   });

//   describe('query CurrentUser', function() {
//     const query = `
//       query CurrentUser {
//         currentUser {
//           id
//           email
//           givenName
//           familyName
//           logins
//           photoURL
//         }
//       }
//     `;
//     const body = buildGraphQuery(query);
//     it('should return null when not authenticated.', function(done) {
//       request(app)
//         .post(GRAPH_ENDPOINT)
//         .send(body)
//         .expect(res => expectGraphSuccess(res, 'currentUser', 'null'))
//         .end(done);
//     });
//     it('should return null when invalid auth is found.', function(done) {
//       request(app)
//         .post(GRAPH_ENDPOINT)
//         .set('Authorization', `Bearer someinvalidtoken`)
//         .send(body)
//         .expect(res => expectGraphSuccess(res, 'currentUser', 'null'))
//         .end(done);
//     });
//     it('should return the current user when logged-in.', function(done) {
//       request(app)
//         .post(GRAPH_ENDPOINT)
//         .set('Authorization', `Bearer ${token}`)
//         .send(body)
//         .expect(res => expectGraphSuccess(res, 'currentUser'))
//         .expect((res) => {
//           const parsed = parseGraphResponse(res, 'currentUser');
//           expect(parsed.id).to.equal(user.id);
//         })
//         .end(done);
//     });
//   });

//   describe('query CheckSession(input: SessionTokenInput!)', function() {
//     const query = `
//       query CheckSession($input: SessionTokenInput!) {
//         checkSession(input: $input) {
//           user {
//             id
//             email
//             givenName
//             familyName
//             logins
//             photoURL
//           }
//           session {
//             id
//             uid
//             cre
//             exp
//             token
//           }
//         }
//       }
//     `;
//     it('should return a 400 when the token is not provided.', function(done) {
//       const body = buildGraphQuery(query);
//       request(app)
//         .post(GRAPH_ENDPOINT)
//         .send(body)
//         .expect(400)
//         .end(done);
//     });
//     it('should return an error when the token is empty.', function(done) {
//       const variables = { input: { token: '' } };
//       const body = buildGraphQuery(query, variables);
//       request(app)
//         .post(GRAPH_ENDPOINT)
//         .send(body)
//         .expect(res => expectGraphError(res, 'Unable to get session: no token was provided.'))
//         .end(done);
//       ;
//     });
//     it('should return an error when the token is invalid.', function(done) {
//       const variables = { input: { token: 'badformat' } };
//       const body = buildGraphQuery(query, variables);
//       request(app)
//         .post(GRAPH_ENDPOINT)
//         .send(body)
//         .expect(res => expectGraphError(res, 'Unable to get session: invalid token format.'))
//         .end(done);
//       ;
//     });
//     it('should return the current auth info.', function(done) {
//       const variables = { input: { token } };
//       const body = buildGraphQuery(query, variables);
//       request(app)
//         .post(GRAPH_ENDPOINT)
//         .send(body)
//         .expect(res => expectGraphSuccess(res, 'checkSession'))
//         .end(done);
//     });
//   }),

//   describe('mutation CreateUser(input: CreateUserInput!)', function() {
//     const query = `
//       mutation CreateUser($input: CreateUserInput!) {
//         createUser(input: $input) {
//           id
//           email
//           givenName
//           familyName
//           logins
//           photoURL
//         }
//       }
//     `;
//     it('should create a user.', function(done) {
//       const payload = {
//         email: 'this.is.a.test@google.com',
//         password: '123456',
//         givenName: 'Jane',
//         familyName: 'Doe',
//       };
//       const variables = { input: { payload } };
//       const body = buildGraphQuery(query, variables);

//       request(app)
//         .post(GRAPH_ENDPOINT)
//         .send(body)
//         .expect((res) => {
//           expectGraphSuccess(res, 'createUser');
//           const parsed = parseGraphResponse(res, 'createUser');
//           expect(parsed.email).to.equal(payload.email);
//         })
//         .end(done);
//     });
//   });

//   describe('mutation LoginUser(input: LoginInput!)', function() {
//     const query = `
//       mutation LoginUser($input: LoginInput!) {
//         loginUser(input: $input) {
//           user {
//             id
//             email
//             givenName
//             familyName
//             logins
//             photoURL
//           }
//           session {
//             id
//             uid
//             cre
//             exp
//             token
//           }
//         }
//       }
//     `;
//     it('should successfully log-in a user.', function(done) {
//       const input = {
//         email: user.email,
//         password: cleartext,
//       };
//       const variables = { input };
//       const body = buildGraphQuery(query, variables);
//       request(app)
//         .post(GRAPH_ENDPOINT)
//         .send(body)
//         .expect((res) => {
//           expectGraphSuccess(res, 'loginUser');
//           const parsed = parseGraphResponse(res, 'loginUser');
//           expect(parsed.user.id).to.equal(user.id);
//         })
//         .end(done);
//     });
//     it('should return an error when user is invalid.', function(done) {
//       const input = {
//         email: user.email,
//         password: 'wrongpassword',
//       };
//       const variables = { input };
//       const body = buildGraphQuery(query, variables);
//       request(app)
//         .post(GRAPH_ENDPOINT)
//         .send(body)
//         .expect((res) => {
//           expectGraphError(res, 'The provided password was incorrect.');
//         })
//         .end(done);
//     });
//   });

//   describe('query Advertiser($input: ModelIdInput!)', function() {
//     let advertiser;
//     before(async function() {
//       await AdvertiserRepo.remove();
//       advertiser = AdvertiserRepo.generate().one();
//       await advertiser.save();
//     });
//     after(async function() {
//       await AdvertiserRepo.remove();
//     });

//     const query = `
//       query Advertiser($input: ModelIdInput!) {
//         advertiser(input: $input) {
//           id
//           name
//           createdAt
//           updatedAt
//           campaigns {
//             id
//           }
//           campaignCount
//         }
//       }
//     `;

//     it('should return an error when not authenticated.', function(done) {
//       const variables = { input: { id: '1234' } };
//       const body = buildGraphQuery(query, variables);
//       testNoAuth(request, app, body, done);
//     });
//     it('should return an error when invalid auth is found.', function(done) {
//       const variables = { input: { id: '1234' } };
//       const body = buildGraphQuery(query, variables);
//       testBadAuth(request, app, body, done);
//     });
//     it('should return an error when advertiser is not found.', function(done) {
//       const id = '5a7b7c91a84f4c086a70bfc5';
//       const variables = { input: { id } };
//       const body = buildGraphQuery(query, variables);
//       request(app)
//         .post(GRAPH_ENDPOINT)
//         .set('Authorization', `Bearer ${token}`)
//         .send(body)
//         .expect(res => expectGraphError(res, `No advertiser record found for ID ${id}.`))
//         .end(done);
//       ;
//     });
//     it('should return an advertiser', function(done) {
//       const id = advertiser.id;
//       const variables = { input: { id } };
//       const body = buildGraphQuery(query, variables);
//       request(app)
//         .post(GRAPH_ENDPOINT)
//         .set('Authorization', `Bearer ${token}`)
//         .send(body)
//         .expect(res => expectGraphSuccess(res, 'advertiser'))
//         .end(done);
//     });
//   });

//   describe('query AllAdvertisers($pagination: PaginationInput, $sort: AdvertiserSortInput)', function() {
//     let advertisers;
//     before(async function() {
//       await AdvertiserRepo.remove();
//       advertisers = AdvertiserRepo.generate(10).all();
//       const promises = advertisers.map(advertiser => advertiser.save());
//       await Promise.all(promises);
//     });
//     after(async function() {
//       await AdvertiserRepo.remove();
//     });

//     const query = `
//       query AllAdvertisers($pagination: PaginationInput, $sort: AdvertiserSortInput) {
//         allAdvertisers(pagination: $pagination, sort: $sort) {
//           totalCount
//           edges {
//             node {
//               id
//             }
//             cursor
//           }
//           pageInfo {
//             hasNextPage
//             endCursor
//           }
//         }
//       }
//     `;

//     it('should return an error when not authenticated.', function(done) {
//       const body = buildGraphQuery(query);
//       testNoAuth(request, app, body, done);
//     });
//     it('should return an error when invalid auth is found.', function(done) {
//       const body = buildGraphQuery(query);
//       testBadAuth(request, app, body, done);
//     });
//     it('should return five advertisers.', function(done) {
//       const pagination = { first: 5 };
//       const variables = { pagination };
//       const body = buildGraphQuery(query, variables);
//       request(app)
//         .post(GRAPH_ENDPOINT)
//         .set('Authorization', `Bearer ${token}`)
//         .send(body)
//         .expect(res => expectGraphSuccess(res, 'allAdvertisers'))
//         .expect((res) => {
//           const data = parseGraphResponse(res, 'allAdvertisers');
//           expect(data.totalCount).to.equal(10);
//           expect(data.edges.length).to.equal(5);
//           expect(data.pageInfo.hasNextPage).to.be.true;
//           expect(data.pageInfo.endCursor).to.be.a('string');
//           const last = data.edges.pop();
//           expect(data.pageInfo.endCursor).to.equal(last.cursor);
//         })
//         .end(done);
//     });
//     it('should should not have a next page when limited by more than the total.', function(done) {
//       const pagination = { first: 50 };
//       const variables = { pagination };
//       const body = buildGraphQuery(query, variables);
//       request(app)
//         .post(GRAPH_ENDPOINT)
//         .set('Authorization', `Bearer ${token}`)
//         .send(body)
//         .expect(res => expectGraphSuccess(res, 'allAdvertisers'))
//         .expect((res) => {
//           const data = parseGraphResponse(res, 'allAdvertisers');
//           expect(data.totalCount).to.equal(10);
//           expect(data.edges.length).to.equal(10);
//           expect(data.pageInfo.hasNextPage).to.be.false;
//           expect(data.pageInfo.endCursor).to.be.null;
//         })
//         .end(done);
//     });
//     it('should return an error when an after cursor is requested that does not exist.', function(done) {
//       const after = CursorType.serialize(AdvertiserRepo.generate().one().id);
//       const pagination = { first: 5, after };
//       const variables = { pagination };
//       const body = buildGraphQuery(query, variables);
//       request(app)
//         .post(GRAPH_ENDPOINT)
//         .set('Authorization', `Bearer ${token}`)
//         .send(body)
//         .expect(res => expectGraphError(res, `No record found for cursor '${after}'.`))
//         .end(done);
//     });
//     it('should return an error when an after cursor is requested that does not exist (while sorting).', function(done) {
//       const after = CursorType.serialize(AdvertiserRepo.generate().one().id);
//       const pagination = { first: 5, after };
//       const sort = { field: 'name', order: -1 };
//       const variables = { pagination, sort };
//       const body = buildGraphQuery(query, variables);
//       request(app)
//         .post(GRAPH_ENDPOINT)
//         .set('Authorization', `Bearer ${token}`)
//         .send(body)
//         .expect(res => expectGraphError(res, `No record found for cursor '${after}'.`))
//         .end(done);
//     });
//   });

//   describe('mutation CreateAdvertiser($input: CreateAdvertiserInput!)', function() {
//     before(function() {
//       return AdvertiserRepo.remove();
//     });
//     after(function() {
//       return AdvertiserRepo.remove();
//     });
//     const query = `
//       mutation CreateAdvertiser($input: CreateAdvertiserInput!) {
//         createAdvertiser(input: $input) {
//           id
//           name
//           createdAt
//           updatedAt
//           campaigns {
//             id
//           }
//           campaignCount
//         }
//       }
//     `;
//     it('should return an error when not authenticated.', function(done) {
//       const payload = { name: 'Test 1' };
//       const variables = { input: { payload } };
//       const body = buildGraphQuery(query, variables);
//       testNoAuth(request, app, body, done);
//     });
//     it('should return an error when invalid auth is found.', function(done) {
//       const payload = { name: 'Test 1' };
//       const variables = { input: { payload } };
//       const body = buildGraphQuery(query, variables);
//       testBadAuth(request, app, body, done);
//     });
//     it('should create an advertiser', function(done) {
//       const payload = { name: 'Test 1' };
//       const variables = { input: { payload } };
//       const body = buildGraphQuery(query, variables);

//       request(app)
//         .post(GRAPH_ENDPOINT)
//         .set('Authorization', `Bearer ${token}`)
//         .send(body)
//         .expect(res => expectGraphSuccess(res, 'createAdvertiser'))
//         .end(done);
//     });
//   });

//   describe('mutation UpdateAdvertiser($input: UpdateAdvertiserInput!)', function() {
//     let advertiser;
//     before(async function() {
//       await AdvertiserRepo.remove();
//       advertiser = AdvertiserRepo.generate().one();
//       await advertiser.save();
//     });
//     after(async function() {
//       await AdvertiserRepo.remove();
//     });
//     const query = `
//       mutation UpdateAdvertiser($input: UpdateAdvertiserInput!) {
//         updateAdvertiser(input: $input) {
//           id
//           name
//           createdAt
//           updatedAt
//           campaigns {
//             id
//           }
//           campaignCount
//         }
//       }
//     `;
//     it('should return an error when not authenticated.', function(done) {
//       const id = '1234';
//       const payload = { name: 'Test 1' };
//       const variables = { input: { id, payload } };
//       const body = buildGraphQuery(query, variables);
//       testNoAuth(request, app, body, done);
//     });
//     it('should return an error when invalid auth is found.', function(done) {
//       const id = '1234';
//       const payload = { name: 'Test 1' };
//       const variables = { input: { id, payload } };
//       const body = buildGraphQuery(query, variables);
//       testBadAuth(request, app, body, done);
//     });
//     it('should return an error when advertiser is not found.', function(done) {
//       const id = '5a7b7c91a84f4c086a70bfc5';
//       const payload = { name: 'Test 1' };
//       const variables = { input: { id, payload } };
//       const body = buildGraphQuery(query, variables);
//       request(app)
//         .post(GRAPH_ENDPOINT)
//         .set('Authorization', `Bearer ${token}`)
//         .send(body)
//         .expect(res => expectGraphError(res, `Unable to update advertiser: no record was found for ID '${id}'`))
//         .end(done);
//       ;
//     });
//     it('should update the advertiser', function(done) {
//       const id = advertiser.id;
//       const payload = { name: 'This is updated!' };
//       const variables = { input: { id, payload } };
//       const body = buildGraphQuery(query, variables);

//       request(app)
//         .post(GRAPH_ENDPOINT)
//         .set('Authorization', `Bearer ${token}`)
//         .send(body)
//         .expect(res => expectGraphSuccess(res, 'updateAdvertiser'))
//         .expect((res) => {
//           const data = parseGraphResponse(res, 'updateAdvertiser');
//           expect(data.name).to.equal(payload.name);
//         })
//         .end(done);
//     });
//   });
// });
