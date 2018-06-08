const models = require('../../src/elastic/models');

describe('elastic/models', function() {
  it('should return search enabled models.', function(done) {
    const expected = [
      'advertiser',
      'campaign',
      'publisher',
      'placement',
      'contact',
      'template',
      'story',
    ].sort();
    const names = models.map(Model => Model.modelName);
    expect(names.sort()).to.deep.equal(expected);
    done();
  });
});
