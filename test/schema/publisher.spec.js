require('../connections');
const Publisher = require('../../src/models/publisher');
const fixtures = require('../../src/fixtures');
const { testTrimmedField, testUniqueField, testRequiredField } = require('../utils');

const generatePublisher = () => fixtures(Publisher, 1).one();

describe('models/publisher', function() {
  before(function() {
    return Publisher.remove();
  });
  after(function() {
    return Publisher.remove();
  });
  it('should successfully save.', async function() {
    const publisher = generatePublisher();
    await expect(publisher.save()).to.be.fulfilled;
  });

  describe('#name', function() {
    let publisher;
    beforeEach(function() {
      publisher = generatePublisher();
    });
    it('should be trimmed.', function() {
      return testTrimmedField(Publisher, publisher, 'name');
    });
    const values = ['', null, undefined];
    values.forEach((value) => {
      it(`should be required and be rejected when the value is '${value}'`, function() {
        return testRequiredField(Publisher, publisher, 'name', value);
      });
    });
    it('should be unique.', function() {
      const another = generatePublisher();
      return testUniqueField(Publisher, publisher, another, 'name');
    });
  });
});
