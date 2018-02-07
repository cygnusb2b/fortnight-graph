const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const Advertiser = require('../../src/models/advertiser');

chai.use(chaiAsPromised);
const expect = chai.expect;

describe('models/advertiser', function() {
  before(function() {
    return Advertiser.remove();
  });

  after(function() {
    return Advertiser.remove();
  });

  describe('#save', function() {
    const names = [
      '', '   ', null, undefined,
    ];
    names.forEach((name) => {
      it(`should throw an error when the name is '${name}'.`, async function() {
        const adv = new Advertiser({ name });
        await expect(adv.save()).to.be.rejectedWith(Error);
      });
    });
    it('should throw an error when the name is not unique.', async function() {
      const data = { name: 'test advertiser' };
      const adv1 = new Advertiser(data);
      await adv1.save();
      const adv2 = new Advertiser(data)
      await expect(adv2.save()).to.be.rejectedWith(Error);
    });
    it('should return the expected model object.', async function() {
      const data = { name: '  Another Advertiser  ' };
      const adv = new Advertiser(data);
      await expect(adv.save()).to.be.fulfilled;
      const found = await Advertiser.findOne({ _id: adv.id });
      expect(found).to.be.an('object');
      expect(found).to.have.property('name').equal('Another Advertiser');
      const now = Date.now()
      expect(found).to.have.property('createdAt').be.a('date');
      expect(found).to.have.property('updatedAt').be.a('date');
    });
  });
});
