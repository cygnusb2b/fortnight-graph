require('../../connections');
const { graphql, setup, teardown } = require('./utils');
const CampaignRepo = require('../../../src/repositories/campaign');
const AdvrtiserRepo = require('../../../src/repositories/advertiser');
const { CursorType } = require('../../../src/graph/custom-types');

const createAdvertiser = async () => {
  const results = await AdvrtiserRepo.seed();
  return results.one();
};

const createCampaign = async () => {
  const results = await CampaignRepo.seed();
  return results.one();
};

const createCampaigns = async (count) => {
  const results = await CampaignRepo.seed({ count });
  return results.all();
};

describe('graph/resolvers/campaign', function() {
  before(async function() {
    await setup();
    await CampaignRepo.remove();
  });
  after(async function() {
    await teardown();
    await CampaignRepo.remove();
  });
  describe('Query', function() {

    describe('campaign', function() {
      let campaign;
      before(async function() {
        campaign = await createCampaign();
      });

      const query = `
        query Campaign($input: ModelIdInput!) {
          campaign(input: $input) {
            id
            name
            createdAt
            updatedAt
            advertiser {
              id
              name
            }
            status
            url
            creatives {
              id
              title
              teaser
              image {
                id
                src
                filePath
                mimeType
                width
                height
                focalPoint {
                  x
                  y
                }
              }
            }
          }
        }
      `;
      it('should reject when no user is logged-in.', async function() {
        const id = '507f1f77bcf86cd799439011';
        const input = { id };
        const variables = { input };
        await expect(graphql({ query, variables, key: 'campaign', loggedIn: false })).to.be.rejectedWith(Error, /you must be logged-in/i);
      });
      it('should reject if no record was found.', async function() {
        const id = '507f1f77bcf86cd799439011';
        const input = { id };
        const variables = { input };
        await expect(graphql({ query, variables, key: 'campaign', loggedIn: true })).to.be.rejectedWith(Error, `No campaign record found for ID ${id}.`);
      });
      it('should return the requested campaign.', async function() {
        const id = campaign.id;
        const input = { id };
        const variables = { input };
        const promise = graphql({ query, variables, key: 'campaign', loggedIn: true });
        await expect(promise).to.eventually.be.an('object').with.property('id', id);
        const data = await promise;
        expect(data).to.have.all.keys('id', 'name', 'createdAt', 'updatedAt', 'advertiser', 'status', 'url', 'creatives');
      });
    });

    describe('allCampaigns', function() {
      let campaigns;
      before(async function() {
        await CampaignRepo.remove();
        campaigns = await createCampaigns(10);
      });
      after(async function() {
        await CampaignRepo.remove();
      });
      const query = `
        query AllCampaigns($pagination: PaginationInput, $sort: CampaignSortInput) {
          allCampaigns(pagination: $pagination, sort: $sort) {
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
        await expect(graphql({ query, key: 'allCampaigns', loggedIn: false })).to.be.rejectedWith(Error, /you must be logged-in/i);
      });
      it('should return five advertisers out of ten.', async function() {
        const pagination = { first: 5 };
        const variables = { pagination };
        const promise = graphql({ query, key: 'allCampaigns', variables, loggedIn: true });
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
        const promise = graphql({ query, key: 'allCampaigns', variables, loggedIn: true });
        await expect(promise).to.eventually.be.an('object');
        const data = await promise;
        expect(data.totalCount).to.equal(10);
        expect(data.edges.length).to.equal(10);
        expect(data.pageInfo.hasNextPage).to.be.false;
        expect(data.pageInfo.endCursor).to.be.null;
      });
      it('should return an error when an after cursor is requested that does not exist.', async function() {
        const after = CursorType.serialize(CampaignRepo.generate(1, { advertiserId: () => '1234' }).one().id);
        const pagination = { first: 5, after };
        const variables = { pagination };
        const promise = graphql({ query, key: 'allCampaigns', variables, loggedIn: true });
        await expect(promise).to.be.rejectedWith(Error, `No record found for cursor '${after}'.`);
      });
    });

  });

  describe('Mutation', function() {

    describe('createCampaign', function() {
      let advertiser;
      before(async function() {
        advertiser = await createAdvertiser();
      });
      after(async function() {
        await AdvrtiserRepo.remove();
      });
      const query = `
        mutation CreateCampaign($input: CreateCampaignInput!) {
          createCampaign(input: $input) {
            id
            name
          }
        }
      `;

      it('should reject when no user is logged-in.', async function() {
        const payload = {
          name: 'Test Campaign',
          advertiserId: advertiser.id,
          url: 'https://www.google.com',
        };
        const input = { payload };
        const variables = { input };
        await expect(graphql({ query, variables, key: 'createCampaign', loggedIn: false })).to.be.rejectedWith(Error, /you must be logged-in/i);
      });
      it('should create the campaign.', async function() {
        const payload = {
          name: 'Test Campaign',
          advertiserId: advertiser.id,
          url: 'https://www.google.com',
        };
        const input = { payload };
        const variables = { input };
        const promise = graphql({ query, variables, key: 'createCampaign', loggedIn: true });
        await expect(promise).to.eventually.be.an('object').with.property('id');
        const data = await promise;
        await expect(CampaignRepo.findById(data.id)).to.eventually.be.an('object').with.property('name', payload.name);
      });
    });

    describe('updateCampaign', function() {
      let campaign;
      before(async function() {
        campaign = await createCampaign();
      });

      const query = `
        mutation UpdateCampaign($input: UpdateCampaignInput!) {
          updateCampaign(input: $input) {
            id
            url
            name
          }
        }
      `;
      const payload = {
        name: 'Updated Campaign Name',
        url: 'https://someupdatedurl.com',
      };

      it('should reject when no user is logged-in.', async function() {
        const id = '507f1f77bcf86cd799439011'
        const input = { id, payload };
        const variables = { input };
        await expect(graphql({ query, variables, key: 'updateCampaign', loggedIn: false })).to.be.rejectedWith(Error, /you must be logged-in/i);
      });
      it('should reject when the campaign record is not found.', async function() {
        const id = '507f1f77bcf86cd799439011'
        const input = { id, payload };
        const variables = { input };
        await expect(graphql({ query, variables, key: 'updateCampaign', loggedIn: true })).to.be.rejectedWith(Error, `Unable to update campaign: no record was found for ID '${id}'`);
      });
      it('should update the campaign.', async function() {
        const id = campaign.id;
        const input = { id, payload };
        const variables = { input };
        const promise = graphql({ query, variables, key: 'updateCampaign', loggedIn: true });
        await expect(promise).to.eventually.be.an('object').with.property('id');
        const data = await promise;
        expect(data.name).to.equal(payload.name);
        expect(data.url).to.equal(payload.url);
        await expect(CampaignRepo.findById(data.id)).to.eventually.be.an('object').with.property('name', payload.name);
      });
    });

    describe('addCampaignCreative', function() {
      let campaign;
      before(async function() {
        campaign = await createCampaign();
      });
      const query = `
        mutation AddCampaignCreative($input: AddCampaignCreativeInput!) {
          addCampaignCreative(input: $input) {
            id
            title
            teaser
            image {
              id
            }
          }
        }
      `;
      it('should reject when no user is logged-in.', async function() {
        const campaignId = campaign.id;
        const input = { campaignId };
        const variables = { input };
        await expect(graphql({ query, variables, key: 'addCampaignCreative', loggedIn: false })).to.be.rejectedWith(Error, /you must be logged-in/i);
      });
      it('should reject when the campaign record is not found.', async function() {
        const campaignId = '507f1f77bcf86cd799439011'
        const input = { campaignId };
        const variables = { input };
        await expect(graphql({ query, variables, key: 'addCampaignCreative', loggedIn: true })).to.be.rejectedWith(Error, /no campaign was found/i);
      });
      it('should add the campaign creative.', async function() {
        const campaignId = campaign.id;
        const payload = { title: 'Some creative title', teaser: 'Some teaser.' };
        const input = { campaignId, payload };
        const variables = { input };
        const promise = graphql({ query, variables, key: 'addCampaignCreative', loggedIn: true });
        await expect(promise).to.eventually.be.an('object');
        const data = await promise;
        expect(data.title).to.equal(payload.title);
        expect(data.teaser).to.equal(payload.teaser);
        expect(data.image).to.be.null;
        const found = await CampaignRepo.findById(campaignId);
        expect(found.creatives.id(data.id)).to.be.an('object');
      });
    });

    describe('removeCampaignCreative', function() {
      let campaign;
      before(async function() {
        campaign = await createCampaign();
      });
      const query = `
        mutation RemoveCampaignCreative($input: RemoveCampaignCreativeInput!) {
          removeCampaignCreative(input: $input)
        }
      `;
      it('should reject when no user is logged-in.', async function() {
        const campaignId = campaign.id;
        const creativeId = campaign.get('creatives.0.id');
        const input = { campaignId, creativeId };
        const variables = { input };
        await expect(graphql({ query, variables, key: 'removeCampaignCreative', loggedIn: false })).to.be.rejectedWith(Error, /you must be logged-in/i);
      });
      it('should reject when the campaign record is not found.', async function() {
        const campaignId = '507f1f77bcf86cd799439011';
        const creativeId = campaignId;
        const input = { campaignId, creativeId };
        const variables = { input };
        await expect(graphql({ query, variables, key: 'removeCampaignCreative', loggedIn: true })).to.be.rejectedWith(Error, /no campaign was found/i);
      });
      it('should remove the campaign creative.', async function() {
        const campaignId = campaign.id;
        const creativeId = campaign.get('creatives.0.id');
        const input = { campaignId, creativeId };
        const variables = { input };
        const promise = graphql({ query, variables, key: 'removeCampaignCreative', loggedIn: true });
        await expect(promise).to.eventually.equal('ok');
        const found = await CampaignRepo.findById(campaignId);
        expect(found.creatives.id(creativeId)).to.be.null;
      });
    });

  });
});
