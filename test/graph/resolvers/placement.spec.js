require('../../connections');
const { graphql, setup, teardown } = require('./utils');
const { CursorType } = require('@limit0/graphql-custom-types');
const PlacementRepo = require('../../../src/repositories/placement');
const PublisherRepo = require('../../../src/repositories/publisher');

const createPublisher = async () => {
  const results = await PublisherRepo.seed();
  return results.one();
};

const createPlacement = async () => {
  const results = await PlacementRepo.seed();
  return results.one();
};

const createPlacements = async (count) => {
  const results = await PlacementRepo.seed({ count });
  return results.all();
};

describe('graph/resolvers/placement', function() {
  before(async function() {
    await setup();
    await PlacementRepo.remove();
  });
  after(async function() {
    await teardown();
    await PlacementRepo.remove();
  });
  describe('Query', function() {

    describe('placement', function() {
      let placement;
      before(async function() {
        placement = await createPlacement();
      });

      const query = `
        query Placement($input: ModelIdInput!) {
          placement(input: $input) {
            id
            name
            createdAt
            updatedAt
            publisher {
              id
              name
            }
          }
        }
      `;
      it('should reject when no user is logged-in.', async function() {
        const id = '507f1f77bcf86cd799439011';
        const input = { id };
        const variables = { input };
        await expect(graphql({ query, variables, key: 'placement', loggedIn: false })).to.be.rejectedWith(Error, /you must be logged-in/i);
      });
      it('should reject if no record was found.', async function() {
        const id = '507f1f77bcf86cd799439011';
        const input = { id };
        const variables = { input };
        await expect(graphql({ query, variables, key: 'placement', loggedIn: true })).to.be.rejectedWith(Error, `No placement record found for ID ${id}.`);
      });
      it('should return the requested placement.', async function() {
        const id = placement.id;
        const input = { id };
        const variables = { input };
        const promise = graphql({ query, variables, key: 'placement', loggedIn: true });
        await expect(promise).to.eventually.be.an('object').with.property('id', id);
        const data = await promise;
        expect(data).to.have.all.keys('id', 'name', 'createdAt', 'updatedAt', 'publisher');
      });
    });

    describe('allPlacements', function() {
      let placements;
      before(async function() {
        await PlacementRepo.remove();
        placements = await createPlacements(10);
      });
      after(async function() {
        await PlacementRepo.remove();
      });
      const query = `
        query AllPlacements($pagination: PaginationInput, $sort: PlacementSortInput) {
          allPlacements(pagination: $pagination, sort: $sort) {
            totalCount
            edges {
              node {
                id
                name
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
        await expect(graphql({ query, key: 'allPlacements', loggedIn: false })).to.be.rejectedWith(Error, /you must be logged-in/i);
      });
      it('should return five placements out of ten.', async function() {
        const pagination = { first: 5 };
        const variables = { pagination };
        const promise = graphql({ query, key: 'allPlacements', variables, loggedIn: true });
        await expect(promise).to.eventually.be.an('object');
        const data = await promise;
        expect(data.totalCount).to.equal(10);
        expect(data.edges.length).to.equal(5);
        expect(data.pageInfo.hasNextPage).to.be.true;
        expect(data.pageInfo.endCursor).to.be.a('string');

        const last = data.edges.pop();
        expect(data.pageInfo.endCursor).to.equal(last.cursor);
      });
      it('should not have a next page when limited by more than the total.', async function() {
        const pagination = { first: 50 };
        const variables = { pagination };
        const promise = graphql({ query, key: 'allPlacements', variables, loggedIn: true });
        await expect(promise).to.eventually.be.an('object');
        const data = await promise;
        expect(data.totalCount).to.equal(10);
        expect(data.edges.length).to.equal(10);
        expect(data.pageInfo.hasNextPage).to.be.false;
      });
      it('should return an error when an after cursor is requested that does not exist.', async function() {
        const { id } = PlacementRepo.generate(1, { publisherId: () => '1234' }).one();
        const after = CursorType.serialize(id);
        const pagination = { first: 5, after };
        const variables = { pagination };
        const promise = graphql({ query, key: 'allPlacements', variables, loggedIn: true });
        await expect(promise).to.be.rejectedWith(Error, `No record found for ID '${id}'`);
      });
    });

    // describe('searchPlacements', function() {
    //   let placements, model;
    //   before(async function() {
    //     await PlacementRepo.remove();
    //     placements = await createPlacements(10);
    //     model = placements[0];
    //   });
    //   after(async function() {
    //     await PlacementRepo.remove();
    //   });

    //   const field = 'name';
    //   const query = `
    //     query SearchPlacements($pagination: PaginationInput, $search: PlacementSearchInput!) {
    //       searchPlacements(pagination: $pagination, search: $search) {
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
    //     await expect(graphql({ query, variables, key: 'searchPlacements', loggedIn: false })).to.be.rejectedWith(Error, /you must be logged-in/i);
    //   });
    //   it('should return at most 5 results.', async function() {
    //     const pagination = { first: 5 };
    //     const search = { typeahead: { field, term: 'John' }}
    //     const variables = { pagination, search };
    //     const promise = graphql({ query, key: 'searchPlacements', variables, loggedIn: true });
    //     await expect(promise).to.eventually.be.an('object');
    //     const data = await promise;
    //     expect(data.totalCount).to.be.at.most(10);
    //     expect(data.edges.length).to.be.at.most(5);
    //   });
    //   it('should return an error when an after cursor is requested that does not exist.', async function() {
    //     const after = CursorType.serialize(PlacementRepo.generate(1, { publisherId: () => '1234' }).one().id);
    //     const pagination = { first: 5, after };
    //     const search = { typeahead: { field, term: 'John' }}
    //     const variables = { pagination, search };
    //     const promise = graphql({ query, key: 'searchPlacements', variables, loggedIn: true });
    //     await expect(promise).to.be.rejectedWith(Error, `No record found for cursor '${after}'.`);
    //   });

    //   it('should reject if field is not specified.', async function() {
    //     const pagination = { first: 5 };
    //     const search = { typeahead: { term: 'John' }}
    //     const variables = { pagination, search };
    //     await expect(graphql({ query, variables, key: 'searchPlacements', loggedIn: true })).to.be.rejectedWith(Error, /Field value\.typeahead\.field of required type PlacementTypeAheadField! was not provided/i);
    //   });
    //   it('should always return an array', async function() {
    //     const pagination = { first: 5 };
    //     const search = { typeahead: { field, term: 'this should never be found unless someone is dumb' }}
    //     const variables = { pagination, search };
    //     const promise = graphql({ query, variables, key: 'searchPlacements', loggedIn: true })
    //     const data = await expect(promise).to.eventually.be.an('object');
    //     expect(data.edges).to.be.an('array')
    //   });
    //   it('should return the expected model', async function() {
    //     const { id, name } = model;
    //     const pagination = { first: 5 };
    //     const search = { typeahead: { field, term: name }}
    //     const variables = { pagination, search };
    //     const promise = graphql({ query, variables, key: 'searchPlacements', loggedIn: true })
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
    //     const promise = graphql({ query, variables, key: 'searchPlacements', loggedIn: true })
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
    //     const promise = graphql({ query, variables, key: 'searchPlacements', loggedIn: true })
    //     const data = await expect(promise).to.eventually.be.an('object');
    //     expect(data.edges).to.be.an('array')
    //     expect(data.edges[0].node).to.deep.include({ id, name });
    //   });
    // });
  });

  describe('Mutation', function() {

    describe('createPlacement', function() {
      let publisher;
      before(async function() {
        publisher = await createPublisher();
      });
      after(async function() {
        await PublisherRepo.remove();
      });
      const query = `
        mutation CreatePlacement($input: CreatePlacementInput!) {
          createPlacement(input: $input) {
            id
            name
            publisher {
              id
              name
            }
            createdAt
            updatedAt
          }
        }
      `;

      it('should reject when no user is logged-in.', async function() {
        const payload = {
          name: 'Test Placement',
          publisherId: publisher.id,
        };
        const input = { payload };
        const variables = { input };
        await expect(graphql({ query, variables, key: 'createPlacement', loggedIn: false })).to.be.rejectedWith(Error, /you must be logged-in/i);
      });
      it('should create the placement.', async function() {
        const payload = {
          name: 'Test Placement',
          publisherId: publisher.id,
        };
        const input = { payload };
        const variables = { input };
        const promise = graphql({ query, variables, key: 'createPlacement', loggedIn: true });
        await expect(promise).to.eventually.be.an('object').with.property('id');
        const data = await promise;
        await expect(PlacementRepo.findById(data.id)).to.eventually.be.an('object').with.property('name', payload.name);
      });
    });

    describe('updatePlacement', function() {
      let placement;
      let publisher;
      before(async function() {
        placement = await createPlacement();
        publisher = await createPublisher();
      });

      const query = `
        mutation UpdatePlacement($input: UpdatePlacementInput!) {
          updatePlacement(input: $input) {
            id
            name
            publisher {
              id
              name
            }
            createdAt
            updatedAt
          }
        }
      `;


      it('should reject when no user is logged-in.', async function() {
        const payload = {
          name: 'Updated Placement Name',
          publisherId: publisher.id,
        };
        const id = '507f1f77bcf86cd799439011'
        const input = { id, payload };
        const variables = { input };
        await expect(graphql({ query, variables, key: 'updatePlacement', loggedIn: false })).to.be.rejectedWith(Error, /you must be logged-in/i);
      });
      it('should reject when the placement record is not found.', async function() {
        const payload = {
          name: 'Updated Placement Name',
          publisherId: publisher.id,
        };
        const id = '507f1f77bcf86cd799439011'
        const input = { id, payload };
        const variables = { input };
        await expect(graphql({ query, variables, key: 'updatePlacement', loggedIn: true })).to.be.rejectedWith(Error, `Unable to update placement: no record was found for ID '${id}'`);
      });
      it('should update the placement.', async function() {
        const payload = {
          name: 'Updated Placement Name',
          publisherId: publisher.id,
        };
        const id = placement.id;
        const input = { id, payload };
        const variables = { input };
        const promise = graphql({ query, variables, key: 'updatePlacement', loggedIn: true });
        await expect(promise).to.eventually.be.an('object').with.property('id');
        const data = await promise;
        expect(data.name).to.equal(payload.name);
        expect(data.publisher.id).to.equal(payload.publisherId);
        await expect(PlacementRepo.findById(data.id)).to.eventually.be.an('object').with.property('name', payload.name);
      });
    });

  });
});
