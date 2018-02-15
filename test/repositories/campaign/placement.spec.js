require('../../connections');
const Repo = require('../../../src/repositories/campaign/placement');
const CampaignRepo = require('../../../src/repositories/campaign');

const createCampaign = async () => {
  const results = await CampaignRepo.seed();
  return results.one();
};

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
    const expected = { foo: 'ba:r', key: 'value!' };
    ['foo:ba%3Ar;key:value!', 'foo:ba%3Ar;key:value%21', 'foo%3Aba%253Ar%3Bkey%3Avalue%21'].forEach((value) => {
      it(`should properly parse the variables when value is '${value}'`, function(done) {
        expect(Repo.parseVariables(value)).to.deep.equal(expected);
        done();
      });
    });
  });

});
