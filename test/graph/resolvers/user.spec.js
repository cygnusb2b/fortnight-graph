require('../../connections');
const { graphql, getAuth, logOut, passwords, setup, teardown } = require('./utils');
const SessionRepo = require('../../../src/repositories/session');
const UserRepo = require('../../../src/repositories/user');

describe('graph/resolvers/user', function() {
  before(async function() {
    await setup();
  });
  after(async function() {
    await teardown();
  });
  describe('Query', function() {

    describe('currentUser', function() {
      const query = `
        query CurrentUser {
          currentUser {
            id
            email
            givenName
            familyName
            logins
            photoURL
          }
        }
      `;
      it('should return null when no user is present.', async function() {
        const data = await graphql({ query, key: 'currentUser' });
        expect(data).to.be.null;
      });
      it('should return the current user.', async function() {
        const data = await graphql({ query, key: 'currentUser', loggedIn: true });
        const { user } = await getAuth();
        expect(data).to.be.an('object').with.property('id', user.id);
      });
    });

    describe('checkSession', function() {
      const query = `
        query CurrentUser($input: SessionTokenInput!) {
          checkSession(input: $input) {
            user {
              id
              email
              givenName
              familyName
              logins
              photoURL
            }
            session {
              id
              uid
              cre
              exp
              token
            }
          }
        }
      `;
      it('should return the current user and session when logged-in.', async function() {
        const { user, session } = await getAuth();

        const input = { token: session.token };
        const variables = { input };

        const data = await graphql({ query, key: 'checkSession', loggedIn: true, variables });
        expect(data).to.be.an('object');
        expect(data.user).to.be.an('object').with.property('id', user.id);
        expect(data.session).to.be.an('object');
        expect(data.session.uid).to.equal(user.id);
        expect(data.session.id).to.equal(session.id);
      });
      it('should throw an error when the token is not provided.', async function() {
        const variables = {};
        await expect(graphql({ query, key: 'checkSession', variables })).to.be.rejectedWith(Error, /SessionTokenInput/i);
      });
      it('should throw an error when the token is no longer valid.', async function() {
        const { session } = await getAuth();
        const input = { token: session.token };
        const variables = { input };
        await logOut();
        await expect(graphql({ query, key: 'checkSession', variables })).to.be.rejectedWith(Error, /no token found/i);
      });
    });

  });

  describe('Mutation', function() {

    describe('loginUser', function() {
      const query = `
        mutation LoginUser($input: LoginInput!) {
          loginUser(input: $input) {
            user {
              id
              email
              givenName
              familyName
              logins
              photoURL
            }
            session {
              id
              uid
              cre
              exp
              token
            }
          }
        }
      `;
      it('should log a user in.', async function() {
        const { user, cleartext } = await getAuth();
        const input = { email: user.email, password: passwords.valid };
        const variables = { input };
        await expect(graphql({ query, key: 'loginUser', variables })).to.eventually.be.an('object');
      });
      it('should error when the password is invalid.', async function() {
        const { user } = await getAuth();
        const input = { email: user.email, password: passwords.invalid };
        const variables = { input };
        await expect(graphql({ query, key: 'loginUser', variables })).to.be.rejectedWith(Error, /password was incorrect/i);
      });
      it('should error when the user does not exist.', async function() {
        const input = { email: 'thisdoesnotexist', password: 'foo' };
        const variables = { input };
        await expect(graphql({ query, key: 'loginUser', variables })).to.be.rejectedWith(Error, /no user was found/i);
      });
    });

    describe('deleteSession', function() {
      const query = `
        mutation DeleteSession {
          deleteSession
        }
      `;

      it('should return ok even when no session exists.', async function() {
        await expect(graphql({ query, key: 'deleteSession', loggedIn: false })).to.eventually.be.equal('ok');
      });

      it('should delete the session.', async function() {
        const { session } = await getAuth();
        const data = await graphql({ query, key: 'deleteSession', loggedIn: true });
        expect(data).to.equal('ok');
        await expect(SessionRepo.get(session.token)).to.be.rejectedWith(Error, /no token found/i);
        await logOut();
      });
    });

    describe('createUser', function() {
      const query = `
        mutation CreateUser($input: CreateUserInput!) {
          createUser(input: $input) {
            id
            email
            givenName
            familyName
            logins
            photoURL
          }
        }
      `;
      it('should create a new user.', async function() {
        const payload = {
          email: 'foo.bar@baz.com',
          password: passwords.valid,
          givenName: 'Jane',
          familyName: 'Doe',
        };
        const input = { payload };
        const variables = { input };
        await expect(graphql({ query, key: 'createUser', variables })).to.eventually.be.an('object');
        await expect(UserRepo.findByEmail(payload.email)).to.be.fulfilled;
      });
    });

  });
});
