require('../../connections');
const { graphql, setup, teardown } = require('./utils');
const AdvertiserRepo = require('../../../src/repositories/advertiser');
const { CursorType } = require('../../../src/graph/custom-types');

const createAdvertiser = async () => {
  const results = await AdvertiserRepo.seed();
  return results.one();
};

const createAdvertisers = async (count) => {
  const results = await AdvertiserRepo.seed({ count });
  return results.all();
};

describe('graph/resolvers/advertiser', function() {
  before(async function() {
    await setup();
    await AdvertiserRepo.remove();
  });
  after(async function() {
    await teardown();
    await AdvertiserRepo.remove();
  });
  describe('Query', function() {

    describe('advertiser', function() {
      let advertiser;
      before(async function() {
        advertiser = await createAdvertiser();
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
      it('should reject when no user is logged-in.', async function() {
        const id = '507f1f77bcf86cd799439011';
        const input = { id };
        const variables = { input };
        await expect(graphql({ query, variables, key: 'advertiser', loggedIn: false })).to.be.rejectedWith(Error, /you must be logged-in/i);
      });
      it('should reject if no record was found.', async function() {
        const id = '507f1f77bcf86cd799439011';
        const input = { id };
        const variables = { input };
        await expect(graphql({ query, variables, key: 'advertiser', loggedIn: true })).to.be.rejectedWith(Error, `No advertiser record found for ID ${id}.`);
      });
      it('should return the requested advertiser.', async function() {
        const id = advertiser.id;
        const input = { id };
        const variables = { input };
        const promise = graphql({ query, variables, key: 'advertiser', loggedIn: true });
        await expect(promise).to.eventually.be.an('object').with.property('id', id);
        const data = await promise;
        expect(data).to.have.all.keys('id', 'name', 'createdAt', 'updatedAt', 'campaigns', 'campaignCount');
      });
    });

    describe('allAdvertisers', function() {
      let advertisers;
      before(async function() {
        await AdvertiserRepo.remove();
        advertisers = await createAdvertisers(10);
      });
      after(async function() {
        await AdvertiserRepo.remove();
      });
      const query = `
        query AllAdvertisers($pagination: PaginationInput, $sort: AdvertiserSortInput) {
          allAdvertisers(pagination: $pagination, sort: $sort) {
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
        await expect(graphql({ query, key: 'allAdvertisers', loggedIn: false })).to.be.rejectedWith(Error, /you must be logged-in/i);
      });
      it('should return five advertisers out of ten.', async function() {
        const pagination = { first: 5 };
        const variables = { pagination };
        const promise = graphql({ query, key: 'allAdvertisers', variables, loggedIn: true });
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
        const promise = graphql({ query, key: 'allAdvertisers', variables, loggedIn: true });
        await expect(promise).to.eventually.be.an('object');
        const data = await promise;
        expect(data.totalCount).to.equal(10);
        expect(data.edges.length).to.equal(10);
        expect(data.pageInfo.hasNextPage).to.be.false;
        expect(data.pageInfo.endCursor).to.be.null;
      });
      it('should return an error when an after cursor is requested that does not exist.', async function() {
        const after = CursorType.serialize(AdvertiserRepo.generate().one().id);
        const pagination = { first: 5, after };
        const variables = { pagination };
        const promise = graphql({ query, key: 'allAdvertisers', variables, loggedIn: true });
        await expect(promise).to.be.rejectedWith(Error,  `No record found for cursor '${after}'.`);
      });
      // it('should return the next set of nodes.', async function() {
      //   const after = CursorType.serialize(advertisers[0].id);
      //   console.info(after, advertisers[0].id);
      //   const pagination = { first: 2, after };
      //   const variables = { pagination };
      //   const promise = graphql({ query, key: 'allAdvertisers', variables, loggedIn: true });
      //   await expect(promise).to.eventually.be.an('object');
      //   const data = await promise;
      //   expect(data.totalCount).to.equal(10);
      //   expect(data.edges.length).to.equal(2);
      // });
    });

  });

  describe('Mutation', function() {

    describe('createAdvertiser', function() {
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
      const payload = {
        name: 'Test Advertiser',
      };

      it('should reject when no user is logged-in.', async function() {
        const input = { payload };
        const variables = { input };
        await expect(graphql({ query, variables, key: 'createAdvertiser', loggedIn: false })).to.be.rejectedWith(Error, /you must be logged-in/i);
      });
      it('should create the advertiser.', async function() {
        const input = { payload };
        const variables = { input };
        const promise = graphql({ query, variables, key: 'createAdvertiser', loggedIn: true });
        await expect(promise).to.eventually.be.an('object').with.property('id');
        const data = await promise;
        await expect(AdvertiserRepo.findById(data.id)).to.eventually.be.an('object');
      });
    });

    describe('updateAdvertiser', function() {
      let advertiser;
      before(async function() {
        advertiser = await createAdvertiser();
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
      const payload = {
        name: 'Updated Advertiser Name',
      };

      it('should reject when no user is logged-in.', async function() {
        const id = '507f1f77bcf86cd799439011'
        const input = { id, payload };
        const variables = { input };
        await expect(graphql({ query, variables, key: 'updateAdvertiser', loggedIn: false })).to.be.rejectedWith(Error, /you must be logged-in/i);
      });
      it('should reject when the advertiser record is not found.', async function() {
        const id = '507f1f77bcf86cd799439011'
        const input = { id, payload };
        const variables = { input };
        await expect(graphql({ query, variables, key: 'updateAdvertiser', loggedIn: true })).to.be.rejectedWith(Error, `Unable to update advertiser: no record was found for ID '${id}'`);
      });
      it('should update the advertiser.', async function() {
        const id = advertiser.id;
        const input = { id, payload };
        const variables = { input };
        const promise = graphql({ query, variables, key: 'updateAdvertiser', loggedIn: true });
        await expect(promise).to.eventually.be.an('object').with.property('id');
        const data = await promise;
        expect(data.name).to.equal(payload.name);
        await expect(AdvertiserRepo.findById(data.id)).to.eventually.be.an('object').with.property('name', payload.name);
      });
    });

  });
});
