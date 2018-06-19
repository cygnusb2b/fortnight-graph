require('../../connections');
const { CursorType } = require('@limit0/graphql-custom-types');
const { graphql, setup, teardown } = require('./utils');
const PublisherRepo = require('../../../src/repositories/publisher');

const createPublisher = async () => {
  const results = await PublisherRepo.seed();
  return results.one();
};

const createPublishers = async (count) => {
  const results = await PublisherRepo.seed({ count });
  return results.all();
};

describe('graph/resolvers/publisher', function() {
  before(async function() {
    await setup();
    await PublisherRepo.remove();
  });
  after(async function() {
    await teardown();
    await PublisherRepo.remove();
  });
  describe('Query', function() {

    describe('publisher', function() {
      let publisher;
      before(async function() {
        publisher = await createPublisher();
      });

      const query = `
        query Publisher($input: ModelIdInput!) {
          publisher(input: $input) {
            id
            name
            logo {
              id
              src
            }
            createdAt
            updatedAt
          }
        }
      `;
      it('should reject when no user is logged-in.', async function() {
        const id = '507f1f77bcf86cd799439011';
        const input = { id };
        const variables = { input };
        await expect(graphql({ query, variables, key: 'publisher', loggedIn: false })).to.be.rejectedWith(Error, /you must be logged-in/i);
      });
      it('should reject if no record was found.', async function() {
        const id = '507f1f77bcf86cd799439011';
        const input = { id };
        const variables = { input };
        await expect(graphql({ query, variables, key: 'publisher', loggedIn: true })).to.be.rejectedWith(Error, `No publisher record found for ID ${id}.`);
      });
      it('should return the requested publisher.', async function() {
        const id = publisher.id;
        const input = { id };
        const variables = { input };
        const promise = graphql({ query, variables, key: 'publisher', loggedIn: true });
        await expect(promise).to.eventually.be.an('object').with.property('id', id);
        const data = await promise;
        expect(data).to.have.all.keys('id', 'name', 'createdAt', 'updatedAt', 'logo');
      });
    });

    describe('allPublishers', function() {
      let publishers;
      before(async function() {
        await PublisherRepo.remove();
        publishers = await createPublishers(10);
      });
      after(async function() {
        await PublisherRepo.remove();
      });
      const query = `
        query AllPublishers($pagination: PaginationInput, $sort: PublisherSortInput) {
          allPublishers(pagination: $pagination, sort: $sort) {
            totalCount
            edges {
              node {
                id
                name
                createdAt
                updatedAt
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
        await expect(graphql({ query, key: 'allPublishers', loggedIn: false })).to.be.rejectedWith(Error, /you must be logged-in/i);
      });
      it('should return five publishers out of ten.', async function() {
        const pagination = { first: 5 };
        const variables = { pagination };
        const promise = graphql({ query, key: 'allPublishers', variables, loggedIn: true });
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
        const promise = graphql({ query, key: 'allPublishers', variables, loggedIn: true });
        await expect(promise).to.eventually.be.an('object');
        const data = await promise;
        expect(data.totalCount).to.equal(10);
        expect(data.edges.length).to.equal(10);
        expect(data.pageInfo.hasNextPage).to.be.false;
      });
      it('should return an error when an after cursor is requested that does not exist.', async function() {
        const { id } = PublisherRepo.generate().one();
        const after = CursorType.serialize(id);
        const pagination = { first: 5, after };
        const variables = { pagination };
        const promise = graphql({ query, key: 'allPublishers', variables, loggedIn: true });
        await expect(promise).to.be.rejectedWith(Error, `No record found for ID '${id}'`);
      });
    });

    // describe('searchPublishers', function() {
    //   let advertisers, model;
    //   before(async function() {
    //     await PublisherRepo.remove();
    //     advertisers = await createPublishers(10);
    //     model = advertisers[0];
    //   });
    //   after(async function() {
    //     await PublisherRepo.remove();
    //   });

    //   const field = 'name';
    //   const query = `
    //     query SearchPublishers($pagination: PaginationInput, $search: PublisherSearchInput!) {
    //       searchPublishers(pagination: $pagination, search: $search) {
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
    //     await expect(graphql({ query, variables, key: 'searchPublishers', loggedIn: false })).to.be.rejectedWith(Error, /you must be logged-in/i);
    //   });
    //   it('should return at most 5 results.', async function() {
    //     const pagination = { first: 5 };
    //     const search = { typeahead: { field, term: 'John' }}
    //     const variables = { pagination, search };
    //     const promise = graphql({ query, key: 'searchPublishers', variables, loggedIn: true });
    //     await expect(promise).to.eventually.be.an('object');
    //     const data = await promise;
    //     expect(data.totalCount).to.be.at.most(10);
    //     expect(data.edges.length).to.be.at.most(5);
    //   });
    //   it('should return an error when an after cursor is requested that does not exist.', async function() {
    //     const after = CursorType.serialize(PublisherRepo.generate().one().id);
    //     const pagination = { first: 5, after };
    //     const search = { typeahead: { field, term: 'John' }}
    //     const variables = { pagination, search };
    //     const promise = graphql({ query, key: 'searchPublishers', variables, loggedIn: true });
    //     await expect(promise).to.be.rejectedWith(Error, `No record found for cursor '${after}'.`);
    //   });

    //   it('should reject if field is not specified.', async function() {
    //     const pagination = { first: 5 };
    //     const search = { typeahead: { term: 'John' }}
    //     const variables = { pagination, search };
    //     await expect(graphql({ query, variables, key: 'searchPublishers', loggedIn: true })).to.be.rejectedWith(Error, /Field value\.typeahead\.field of required type PublisherTypeAheadField! was not provided/i);
    //   });
    //   it('should always return an array', async function() {
    //     const pagination = { first: 5 };
    //     const search = { typeahead: { field, term: 'this should never be found unless someone is dumb' }}
    //     const variables = { pagination, search };
    //     const promise = graphql({ query, variables, key: 'searchPublishers', loggedIn: true })
    //     const data = await expect(promise).to.eventually.be.an('object');
    //     expect(data.edges).to.be.an('array')
    //   });
    //   it('should return the expected model', async function() {
    //     const { id, name } = model;
    //     const pagination = { first: 5 };
    //     const search = { typeahead: { field, term: name }}
    //     const variables = { pagination, search };
    //     const promise = graphql({ query, variables, key: 'searchPublishers', loggedIn: true })
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
    //     const promise = graphql({ query, variables, key: 'searchPublishers', loggedIn: true })
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
    //     const promise = graphql({ query, variables, key: 'searchPublishers', loggedIn: true })
    //     const data = await expect(promise).to.eventually.be.an('object');
    //     expect(data.edges).to.be.an('array')
    //     expect(data.edges[0].node).to.deep.include({ id, name });
    //   });
    // });

  });

  describe('Mutation', function() {

    describe('createPublisher', function() {
      const query = `
        mutation CreatePublisher($input: CreatePublisherInput!) {
          createPublisher(input: $input) {
            id
            name
            logo {
              id
              src
            }
            createdAt
            updatedAt
          }
        }
      `;

      it('should reject when no user is logged-in.', async function() {
        const payload = { name: 'Test Publisher' };
        const input = { payload };
        const variables = { input };
        await expect(graphql({ query, variables, key: 'createPublisher', loggedIn: false })).to.be.rejectedWith(Error, /you must be logged-in/i);
      });
      it('should create the publisher.', async function() {
        const payload = { name: 'Test Publisher' };
        const input = { payload };
        const variables = { input };
        const promise = graphql({ query, variables, key: 'createPublisher', loggedIn: true });
        await expect(promise).to.eventually.be.an('object').with.property('id');
        const data = await promise;
        await expect(PublisherRepo.findById(data.id)).to.eventually.be.an('object');
      });
    });

    describe('updatePublisher', function() {
      let publisher;
      before(async function() {
        publisher = await createPublisher();
      });

      const query = `
        mutation UpdatePublisher($input: UpdatePublisherInput!) {
          updatePublisher(input: $input) {
            id
            name
            logo {
              id
              src
            }
            createdAt
            updatedAt
          }
        }
      `;
      const payload = {
        name: 'Updated Publisher Name',
        // logo: 'https://some.url/image.png',
      };

      it('should reject when no user is logged-in.', async function() {
        const id = '507f1f77bcf86cd799439011'
        const input = { id, payload };
        const variables = { input };
        await expect(graphql({ query, variables, key: 'updatePublisher', loggedIn: false })).to.be.rejectedWith(Error, /you must be logged-in/i);
      });
      it('should reject when the publisher record is not found.', async function() {
        const id = '507f1f77bcf86cd799439011'
        const input = { id, payload };
        const variables = { input };
        await expect(graphql({ query, variables, key: 'updatePublisher', loggedIn: true })).to.be.rejectedWith(Error, `Unable to update publisher: no record found for ID ${id}`);
      });
      it('should update the publisher.', async function() {
        const id = publisher.id;
        const input = { id, payload };
        const variables = { input };
        const promise = graphql({ query, variables, key: 'updatePublisher', loggedIn: true });
        await expect(promise).to.eventually.be.an('object').with.property('id');
        const data = await promise;
        expect(data.name).to.equal(payload.name);
        await expect(PublisherRepo.findById(data.id)).to.eventually.be.an('object').with.property('name', payload.name);
      });
    });

  });
});
