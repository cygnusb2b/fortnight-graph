require('../connections');
const Repo = require('../../src/repositories/autocomplete');
const PlacementRepo = require('../../src/repositories/placement');
const PlacementModel = require('../../src/models/placement');
const Utils = require('../utils');

const createPublisher = async () => {
  const results = await Repo.seed();
  return results.one();
};

describe('repositories/autocomplete', function() {
  before(function() {
    return PlacementRepo.remove();
  });
  after(function() {
    return PlacementRepo.remove();
  });
  it('should export an object', function(done) {
    expect(Repo).to.be.an('object');
    done();
  });

  describe('#autocomplete', function() {
    it('should return the expected results', async function() {
      const generated = await PlacementRepo.seed();
      const placement = generated.one();
      const { id, name } = placement;
      const results = await Repo.autocomplete('placement', 'name', name);
      const firstResult = results[0];
      expect(results).to.be.an('array');
      expect(firstResult).to.be.an.instanceof(PlacementModel);
      expect(firstResult.get('name')).to.equal(name);
    });
  });
});
