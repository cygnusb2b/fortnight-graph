require('../connections');
const Repo = require('../../src/repositories/request');
const PlacementRepo = require('../../src/repositories/placement');
const CampaignRepo = require('../../src/repositories/campaign');
const Model = require('../../src/models/request');

const createRequest = async () => {
  const results = await Repo.seed();
  return results.one();
}

describe('repositories/request', function() {
  before(function() {
    return Repo.remove();
  });
  after(function() {
    return Repo.remove();
  });
  it('should export an object.', function(done) {
    expect(Repo).to.be.an('object');
    done();
  });

  describe('#generate', function() {
    let placement;
    let campaign;
    before(async function() {
      const p = await PlacementRepo.seed();
      placement = p.one();
      const c = await CampaignRepo.seed();
      campaign = c.one();
    });
    it('should return a fixture result with one record.', function(done) {
      const results = Repo.generate(undefined, {
        cid: () => campaign.id,
        pid: () => placement.id,
      });
      expect(results).to.be.an('object');
      expect(results.length).to.equal(1);
      done();
    });
    it('should return a fixture result with the specified number of records.', function(done) {
      const results = Repo.generate(5, {
        cid: () => campaign.id,
        pid: () => placement.id,
      });
      expect(results).to.be.an('object');
      expect(results.length).to.equal(5);
      done();
    });
  });

  describe('#seed', function() {
    it('should generate and save the fixture data.', async function() {
      await expect(Repo.seed()).to.be.fulfilled.and.eventually.be.an('object');
      await expect(Repo.seed({ count: 2 })).to.be.fulfilled.and.eventually.be.an('object');
    });
  });

});
