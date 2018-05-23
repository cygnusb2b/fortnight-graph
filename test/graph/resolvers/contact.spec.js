require('../../connections');
const { CursorType } = require('@limit0/graphql-custom-types');
const { graphql, setup, teardown } = require('./utils');
const ContactRepo = require('../../../src/repositories/contact');

const createContact = async () => {
  const results = await ContactRepo.seed();
  return results.one();
};

const createContacts = async (count) => {
  const results = await ContactRepo.seed({ count });
  return results.all();
};

describe('graph/resolvers/contact', function() {
  before(async function() {
    await setup();
    await ContactRepo.remove();
  });
  after(async function() {
    await teardown();
    await ContactRepo.remove();
  });
  describe('Query', function() {

    describe('contact', function() {
      let contact;
      before(async function() {
        contact = await createContact();
      });

      const query = `
        query Contact($input: ModelIdInput!) {
          contact(input: $input) {
            id
            name
            email
            givenName
            familyName
          }
        }
      `;
      it('should reject when no user is logged-in.', async function() {
        const id = '507f1f77bcf86cd799439011';
        const input = { id };
        const variables = { input };
        await expect(graphql({ query, variables, key: 'contact', loggedIn: false })).to.be.rejectedWith(Error, /you must be logged-in/i);
      });
      it('should reject if no record was found.', async function() {
        const id = '507f1f77bcf86cd799439011';
        const input = { id };
        const variables = { input };
        await expect(graphql({ query, variables, key: 'contact', loggedIn: true })).to.be.rejectedWith(Error, `No contact record found for ID ${id}.`);
      });
      it('should return the requested contact.', async function() {
        const id = contact.id;
        const input = { id };
        const variables = { input };
        const promise = graphql({ query, variables, key: 'contact', loggedIn: true });
        await expect(promise).to.eventually.be.an('object').with.property('id', id);
        const data = await promise;
        expect(data).to.have.all.keys('id', 'name', 'email', 'givenName', 'familyName');
      });
    });

    describe('allContacts', function() {
      let contacts;
      before(async function() {
        await ContactRepo.remove();
        contacts = await createContacts(10);
      });
      after(async function() {
        await ContactRepo.remove();
      });
      const query = `
        query AllContacts($pagination: PaginationInput, $sort: ContactSortInput) {
          allContacts(pagination: $pagination, sort: $sort) {
            totalCount
            edges {
              node {
                id
                name
                email
              }
              cursor
            }
            pageInfo {
              hasNextPage
              endCursor
            }
          }
        }
      `;
      it('should reject when no user is logged-in.', async function() {
        await expect(graphql({ query, key: 'allContacts', loggedIn: false })).to.be.rejectedWith(Error, /you must be logged-in/i);
      });
      it('should return five contacts out of ten.', async function() {
        const pagination = { first: 5 };
        const variables = { pagination };
        const promise = graphql({ query, key: 'allContacts', variables, loggedIn: true });
        await expect(promise).to.eventually.be.an('object');
        const data = await promise;
        expect(data.totalCount).to.equal(10);
        expect(data.edges.length).to.equal(5);
        expect(data.pageInfo.hasNextPage).to.be.true;
        expect(data.pageInfo.endCursor).to.be.a('string');

        const last = data.edges.pop();
        expect(data.pageInfo.endCursor).to.equal(last.cursor);
      });
      it('should should not have a next page when limited by more than the total.', async function() {
        const pagination = { first: 50 };
        const variables = { pagination };
        const promise = graphql({ query, key: 'allContacts', variables, loggedIn: true });
        await expect(promise).to.eventually.be.an('object');
        const data = await promise;
        expect(data.totalCount).to.equal(10);
        expect(data.edges.length).to.equal(10);
        expect(data.pageInfo.hasNextPage).to.be.false;
        expect(data.pageInfo.endCursor).to.be.null;
      });
      it('should return an error when an after cursor is requested that does not exist.', async function() {
        const after = CursorType.serialize(ContactRepo.generate().one().id);
        const pagination = { first: 5, after };
        const variables = { pagination };
        const promise = graphql({ query, key: 'allContacts', variables, loggedIn: true });
        await expect(promise).to.be.rejectedWith(Error, `No record found for cursor '${after}'.`);
      });
    });

    // describe('searchContacts', function() {
    //   let advertisers, model;
    //   before(async function() {
    //     await ContactRepo.remove();
    //     advertisers = await createContacts(10);
    //     model = advertisers[0];
    //   });
    //   after(async function() {
    //     await ContactRepo.remove();
    //   });

    //   const field = 'name';
    //   const query = `
    //     query SearchContacts($pagination: PaginationInput, $search: ContactSearchInput!) {
    //       searchContacts(pagination: $pagination, search: $search) {
    //         totalCount
    //         edges {
    //           node {
    //             id
    //             name
    //           }
    //           cursor
    //         }
    //         pageInfo {
    //           hasNextPage
    //           endCursor
    //         }
    //       }
    //     }
    //   `;
    //   it('should reject when no user is logged-in.', async function() {
    //     const pagination = { first: 5 };
    //     const search = { typeahead: { field, term: 'John' }}
    //     const variables = { pagination, search };
    //     await expect(graphql({ query, variables, key: 'searchContacts', loggedIn: false })).to.be.rejectedWith(Error, /you must be logged-in/i);
    //   });
    //   it('should return at most 5 results.', async function() {
    //     const pagination = { first: 5 };
    //     const search = { typeahead: { field, term: 'John' }}
    //     const variables = { pagination, search };
    //     const promise = graphql({ query, key: 'searchContacts', variables, loggedIn: true });
    //     await expect(promise).to.eventually.be.an('object');
    //     const data = await promise;
    //     expect(data.totalCount).to.be.at.most(10);
    //     expect(data.edges.length).to.be.at.most(5);
    //   });
    //   it('should return an error when an after cursor is requested that does not exist.', async function() {
    //     const after = CursorType.serialize(ContactRepo.generate().one().id);
    //     const pagination = { first: 5, after };
    //     const search = { typeahead: { field, term: 'John' }}
    //     const variables = { pagination, search };
    //     const promise = graphql({ query, key: 'searchContacts', variables, loggedIn: true });
    //     await expect(promise).to.be.rejectedWith(Error, `No record found for cursor '${after}'.`);
    //   });

    //   it('should reject if field is not specified.', async function() {
    //     const pagination = { first: 5 };
    //     const search = { typeahead: { term: 'John' }}
    //     const variables = { pagination, search };
    //     await expect(graphql({ query, variables, key: 'searchContacts', loggedIn: true })).to.be.rejectedWith(Error, /Field value\.typeahead\.field of required type ContactTypeAheadField! was not provided/i);
    //   });
    //   it('should always return an array', async function() {
    //     const pagination = { first: 5 };
    //     const search = { typeahead: { field, term: 'this should never be found unless someone is dumb' }}
    //     const variables = { pagination, search };
    //     const promise = graphql({ query, variables, key: 'searchContacts', loggedIn: true })
    //     const data = await expect(promise).to.eventually.be.an('object');
    //     expect(data.edges).to.be.an('array')
    //   });
    //   it('should return the expected model', async function() {
    //     const { id, name } = model;
    //     const pagination = { first: 5 };
    //     const search = { typeahead: { field, term: name }}
    //     const variables = { pagination, search };
    //     const promise = graphql({ query, variables, key: 'searchContacts', loggedIn: true })
    //     const data = await expect(promise).to.eventually.be.an('object');
    //     expect(data.edges).to.be.an('array')
    //     expect(data.edges[0].node).to.deep.include({ id, name });
    //   });
    //   it('should allow partial searches', async function() {
    //     const { id, name } = model;
    //     const term = name.substr(0, 3);
    //     const pagination = { first: 5 };
    //     const search = { typeahead: { field, term }}
    //     const variables = { pagination, search };
    //     const promise = graphql({ query, variables, key: 'searchContacts', loggedIn: true })
    //     const data = await expect(promise).to.eventually.be.an('object');
    //     expect(data.edges).to.be.an('array')
    //     expect(data.edges[0].node).to.deep.include({ id, name });
    //   });
    //   it('should allow case-insensitive searches', async function() {
    //     const { id, name } = model;
    //     const term = name.toUpperCase();
    //     const pagination = { first: 5 };
    //     const search = { typeahead: { field, term }}
    //     const variables = { pagination, search };
    //     const promise = graphql({ query, variables, key: 'searchContacts', loggedIn: true })
    //     const data = await expect(promise).to.eventually.be.an('object');
    //     expect(data.edges).to.be.an('array')
    //     expect(data.edges[0].node).to.deep.include({ id, name });
    //   });
    // });

  });

  describe('Mutation', function() {

    describe('createContact', function() {
      const query = `
        mutation CreateContact($input: CreateContactInput!) {
          createContact(input: $input) {
            id
            name
            email
            givenName
            familyName
          }
        }
      `;

      it('should reject when no user is logged-in.', async function() {
        const payload = { email: 'joe@blow.com' };
        const input = { payload };
        const variables = { input };
        await expect(graphql({ query, variables, key: 'createContact', loggedIn: false })).to.be.rejectedWith(Error, /you must be logged-in/i);
      });
      it('should create the contact.', async function() {
        const payload = { email: 'joe@blow.com' };
        const input = { payload };
        const variables = { input };
        const promise = graphql({ query, variables, key: 'createContact', loggedIn: true });
        await expect(promise).to.eventually.be.an('object').with.property('id');
        const data = await promise;
        await expect(ContactRepo.findById(data.id)).to.eventually.be.an('object');
      });
    });

    describe('updateContact', function() {
      let contact;
      before(async function() {
        contact = await createContact();
      });

      after(async function() {
        await ContactRepo.remove();
      })

      const query = `
        mutation UpdateContact($input: UpdateContactInput!) {
          updateContact(input: $input) {
            id
            name
            email
            givenName
            familyName
          }
        }
      `;
      const payload = {
        email: 'jane@blau.com',
        givenName: 'Updated Given Name',
      };

      it('should reject when no user is logged-in.', async function() {
        const id = '507f1f77bcf86cd799439011'
        const input = { id, payload };
        const variables = { input };
        await expect(graphql({ query, variables, key: 'updateContact', loggedIn: false })).to.be.rejectedWith(Error, /you must be logged-in/i);
      });
      it('should reject when the contact record is not found.', async function() {
        const id = '507f1f77bcf86cd799439011'
        const input = { id, payload };
        const variables = { input };
        await expect(graphql({ query, variables, key: 'updateContact', loggedIn: true })).to.be.rejectedWith(Error, `Unable to update contact: no record was found for ID '${id}'`);
      });
      it('should update the contact.', async function() {
        const id = contact.id;
        const input = { id, payload };
        const variables = { input };
        const promise = graphql({ query, variables, key: 'updateContact', loggedIn: true });
        await expect(promise).to.eventually.be.an('object').with.property('id');
        const data = await promise;
        expect(data.givenName).to.equal(payload.givenName);
        await expect(ContactRepo.findById(data.id)).to.eventually.be.an('object').with.property('givenName', payload.givenName);
      });
    });

  });
});
