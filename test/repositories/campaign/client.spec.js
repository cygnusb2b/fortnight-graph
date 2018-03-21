require('../../connections');
const Repo = require('../../../src/repositories/campaign/client');
const Campaign = require('../../../src/models/campaign');
const CampaignRepo = require('../../../src/repositories/campaign');

const createCampaign = async () => {
  const results = await CampaignRepo.seed();
  return results.one();
};

describe('repositories/campaign/client', function() {
  before(async function() {
    await CampaignRepo.remove();
  });
  after(async function() {
    await CampaignRepo.remove();
  });
  it('should export an object.', function(done) {
    expect(Repo).to.be.an('object');
    done();
  });

  describe('#findByHash', function() {
    let campaign;
    before(async function() {
      campaign = await createCampaign();
    });
    it('should reject when no campaign hash is provided.', async function() {
      await expect(Repo.findByHash()).to.be.rejectedWith(Error, /no hash was provided/);
    });
    it('should retrieve campaign by hash', async function() {
      expect(Repo.findByHash(campaign.hash)).to.eventually.be.an('object').with.property('id', campaign.id);
    });
  });

  describe('#updateFor', function() {
    let campaign;
    before(async function() {
      campaign = await createCampaign();
    });
    it('should reject when no campaign ID is provided.', async function() {
      await expect(Repo.updateFor()).to.be.rejectedWith(Error, /Unable to handle submission/);
    });
    it('should reject when the provided campaign does not exist.', async function() {
      const campaignId = '507f1f77bcf86cd799439011';
      await expect(Repo.updateFor(campaignId, { url: 'http://google.com/404' })).to.be.rejectedWith(Error, /Unable to handle submission/);
    });
    //async updateFor(id, { url, creatives } = {}) {
    it('should fulfill and update the campaign & creative.', async function() {
      const url = 'https://www.google.com/404';
      const creatives = [
        {
          id: campaign.creatives[0].id,
          title : 'Some new title',
          teaser : 'some teaser',
          // image : {
          //   filePath: 'fakefolder',
          //   src: `${url}/test.jpg`,
          // },
        }
      ];
      const payload = { url, creatives };
      const id = campaign.id;
      const created = await Repo.updateFor(id, payload);
      expect(created).to.be.an('object').with.property('url', payload.url);
      expect(created.creatives).to.be.an('array');
      expect(created.creatives[0].title).to.equal(payload.creatives[0].title);
      expect(created.creatives[0].teaser).to.equal(payload.creatives[0].teaser);
    });
  });

});
