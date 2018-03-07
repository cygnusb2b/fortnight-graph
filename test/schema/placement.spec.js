require('../connections');
const Publisher = require('../../src/models/publisher');
const Placement = require('../../src/models/placement');
const fixtures = require('../../src/fixtures');
const { testTrimmedField, testUniqueField, testRequiredField } = require('../utils');

const generatePlacement = (publisher) => {
  return fixtures(Placement, 1, {
    publisherId: () => publisher.id,
    creatives: () => [],
  }).one();
};

describe('schema/placement', function() {
  let publisher;
  before(async function() {
    await Placement.remove();
    await Publisher.remove();
    publisher = await fixtures(Publisher, 1).one().save();
  });
  after(async function() {
    await Placement.remove();
    await Publisher.remove();
  });

  it('should successfully save.', async function() {
    const placement = generatePlacement(publisher);
    await expect(placement.save()).to.be.fulfilled;
  });

  describe('.name', function() {
    let placement;
    beforeEach(function() {
      placement = generatePlacement(publisher);
    });
    it('should be trimmed.', function() {
      return testTrimmedField(Placement, placement, 'name');
    });
    ['', null, undefined].forEach((value) => {
      it(`should be required and be rejected when the value is '${value}'`, function() {
        return testRequiredField(Placement, placement, 'name', value);
      });
    });
    it('should allow the same name, per different publisher.', async function() {
      const pub2 = await fixtures(Publisher, 1).one().save();
      const placement2 = generatePlacement(pub2);
      placement2.name = placement.name;
      await expect(placement.save()).to.be.fulfilled;
      await expect(placement2.save()).to.be.fulfilled;
    });
  });

  describe('.publisherId', function() {
    let placement;
    beforeEach(function() {
      placement = generatePlacement(publisher);
    });
    [null, undefined].forEach((value) => {
      it(`should be required and be rejected when the value is '${value}'`, function() {
        return testRequiredField(Placement, placement, 'publisherId', value);
      });
    });
    ['', 1234, '1234'].forEach((value) => {
      it(`should be a MongoId and be rejected when the value is '${value}'`, async function() {
        placement.set('publisherId', value);
        await expect(placement.save()).to.be.rejectedWith(Error, /to ObjectID failed/i);
      });
    });
    it('should be rejected when the publisher does not exist.', async function() {
      const id = '3f056e318e9a4da0d049fcc3';
      placement.set('publisherId', id);
      await expect(placement.save()).to.be.rejectedWith(Error, `No publisher found for ID ${id}`);
    });
  });

  describe('.name + .publisherId', function() {
    it('should be unique.', async function() {
      const placement = generatePlacement(publisher);
      const placement2 = generatePlacement(publisher);

      const name = 'The same name cannot be shared for the same pub.';

      placement.name = name;
      placement2.name = name;

      await expect(placement.save()).to.be.fulfilled;
      await expect(placement2.save()).to.be.rejectedWith(Error, /duplicate key/i)

    });
  });

});
