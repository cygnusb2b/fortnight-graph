require('../../connections');
const Repo = require('../../../src/repositories/campaign/placement');
const CampaignRepo = require('../../../src/repositories/campaign');
const PlacementRepo = require('../../../src/repositories/placement');

const createCampaign = async () => {
  const results = await CampaignRepo.seed();
  return results.one();
};

const createPlacement = async () => {
  const results = await PlacementRepo.seed();
  return results.one();
}

describe('repositories/campaign', function() {
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

  describe('#parseVariables', function() {
    [undefined, {}, '', null].forEach((value) => {
      it(`should return an empty object when the vars are invalid: '${value}'`, function(done) {
        expect(Repo.parseVariables(value)).to.deep.equal({});
        done();
      });
    });
    const expected = { foo: 'ba:r', 'ke;y': 'value!' };
    ['foo:ba%3Ar;ke%3By:value!', 'foo:ba%3Ar;ke%3By:value%21'].forEach((value) => {
      it(`should properly parse the variables when value is '${value}'`, function(done) {
        expect(Repo.parseVariables(value)).to.deep.equal(expected);
        done();
      });
    });
    ['foo:ba:r;ke;y:value!', 'foo:ba:r;ke;y:value%21'].forEach((value) => {
      it(`should not parse the variables when value is '${value}'`, function(done) {
        expect(Repo.parseVariables(value)).to.not.deep.equal(expected);
        done();
      });
    });
  });

  describe('#findFor', function() {
    let placement;
    before(async function() {
      await CampaignRepo.remove();
      placement = await createPlacement();
    });
    it('should reject when no params are sent', async function() {
      await expect(Repo.findFor()).to.be.rejectedWith(Error, 'No placement ID was provided.');
    });
    [null, undefined, ''].forEach((pid) => {
      it(`should reject when the pid is '${pid}'.`, async function() {
        await expect(Repo.findFor({ pid })).to.be.rejectedWith(Error, 'No placement ID was provided.');
      });
    });
    it('should reject when no placement could be found.', async function() {
      const pid = '507f1f77bcf86cd799439011';
      await expect(Repo.findFor({ pid })).to.be.rejectedWith(Error, `No placement exists for pid '${pid}'`);
    });
    it('should reject when the limit is higher than 10.', async function() {
      const pid = placement.id;
      const limit = 11;
      await expect(Repo.findFor({ pid, limit })).to.be.rejectedWith(Error, 'You cannot return more than 10 ads in one request.');
    });
    it('should fulfill when no campaigns are found.', async function() {
      const pid = placement.id;
      await expect(Repo.findFor({ pid })).to.be.fulfilled.and.eventually.be.an('array').with.property('length', 0);
    });
    it('should fulfill when a campaign is found.', async function() {
      const pid = placement.id;
      const limit = 1;
      const campaign = await createCampaign();
      await expect(Repo.findFor({ pid, limit })).to.be.fulfilled.and.eventually.be.an('array').with.property('length', 1);
      await CampaignRepo.remove();
    });
    [undefined, 0, -1, 1, null, '1'].forEach((limit) => {
      it(`should fulfill with a single campaign when limit is ${limit}`, async function() {
        const pid = placement.id;
        const campaign = await createCampaign();
        await expect(Repo.findFor({ pid, limit })).to.be.fulfilled.and.eventually.be.an('array').with.property('length', 1);
        await CampaignRepo.remove();
      });
    });

  });

});
