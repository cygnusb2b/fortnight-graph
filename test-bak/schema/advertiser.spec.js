require('../connections');
const Advertiser = require('../../src/models/advertiser');
const Contact = require('../../src/models/contact');
const fixtures = require('../../src/fixtures');
const { testTrimmedField, testUniqueField, testRequiredField } = require('../utils');

const generateAdvertiser = async () => {
  const internalContact = await fixtures(Contact, 1).one().save();
  const externalContact = await fixtures(Contact, 1).one().save();
  return await fixtures(Advertiser, 1, {
    internalContactIds: [
      internalContact.id
    ],
    externalContactIds: [
      externalContact.id
    ],
  }).one();
};

describe('schema/advertiser', function() {
  before(function() {
    return Contact.remove();
    return Advertiser.remove();
  });
  after(function() {
    return Contact.remove();
    return Advertiser.remove();
  });
  it('should successfully save.', async function() {
    const advertiser = await generateAdvertiser();
    await expect(advertiser.save()).to.be.fulfilled;
  });

  describe('#name', function() {
    let advertiser;
    beforeEach(async function() {
      advertiser = await generateAdvertiser();
    });
    it('should be trimmed.', function() {
      return testTrimmedField(Advertiser, advertiser, 'name');
    });
    const values = ['', null, undefined];
    values.forEach((value) => {
      it(`should be required and be rejected when the value is '${value}'`, function() {
        return testRequiredField(Advertiser, advertiser, 'name', value);
      });
    });
    it('should be unique.', async function() {
      const another = await generateAdvertiser();
      return testUniqueField(Advertiser, advertiser, another, 'name');
    });
  });

  describe('#notify', function() {
    let advertiser;
    beforeEach(async function() {
      advertiser = await generateAdvertiser();
    })

    it('should be an object', function() {
      expect(advertiser.get('notify')).to.be.an('object');
      expect(advertiser.get('notify.internal')).to.be.an('array');
      expect(advertiser.get('notify.external')).to.be.an('array');
    })

  });
});
