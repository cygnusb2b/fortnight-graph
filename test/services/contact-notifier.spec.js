const sgMail = require('@sendgrid/mail');
require('../connections');
const ContactNotifier = require('../../src/services/contact-notifier');
const CampaignRepo = require('../../src/repositories/campaign');
const ContactRepo = require('../../src/repositories/contact');
const sandbox = sinon.createSandbox();

const createCampaign = async () => {
  const result = await CampaignRepo.seed();
  return result.one();
}

const createContacts = async (count = 1) => {
  const results = await ContactRepo.seed({ count });
  return results.all();
}

describe('services/contact-notifier', function() {

  describe('#resolveAddresses', function() {
    beforeEach(async function() {
      await ContactRepo.remove();
    })
    afterEach(async function() {
      await ContactRepo.remove();
    })
    it('should always return an array', async function() {
      await expect(ContactNotifier.resolveAddresses()).to.eventually.be.rejected;
      await expect(ContactNotifier.resolveAddresses([])).to.eventually.be.an('array');
      await expect(ContactNotifier.resolveAddresses(['5afda48db038cd00b71361c1'])).to.eventually.be.an('array');
    });
    it('should only return the specified contacts', async function() {
      const contacts = await createContacts(10);

      await [1,3,5,9].forEach(async function(count) {
        const ids = contacts.slice(contacts.length - count).map(c => c.id);
        const result = await ContactNotifier.resolveAddresses(ids);
        expect(result).to.be.an('array');
        expect(result.length).to.equal(count);
        // await expect(ContactNotifier.resolveAddresses(ids).to.eventually.be.an('array').with('length', count))
      })

    });
    it('should format the contacts as email strings', async function() {
      const contacts = await createContacts(10);
      const addresses = await ContactNotifier.resolveAddresses(contacts.map(c => c.id));

      for (let i = 0; i < addresses.length; i++) {
        const contact = contacts[i];
        const address = addresses[i];
        expect(address).to.equal(`${contact.givenName} ${contact.familyName} <${contact.email}>`);
      }

    });
  });

  describe('#send', function() {
    let key;
    let from;
    let bcc;
    before(function() {
      key = process.env.SENDGRID_API_KEY;
      from = process.env.SENDGRID_FROM;
      bcc = process.env.SENDGRID_BCC;
    })
    beforeEach(function() {
      sandbox.stub(sgMail, 'setApiKey').resolves();
      sandbox.stub(sgMail, 'send').resolves();
    })
    afterEach(function() {
      process.env.SENDGRID_API_KEY = key;
      process.env.SENDGRID_FROM = from;
      process.env.SENDGRID_BCC = bcc;
      sandbox.restore();
    })

    it('should reject if an API key is not set', function() {
      delete process.env.SENDGRID_API_KEY;
      expect(ContactNotifier.send({})).to.be.rejectedWith(Error, /SENDGRID_API_KEY/);
    });
    it('should reject if a from address is not set', function() {
      delete process.env.SENDGRID_FROM;
      expect(ContactNotifier.send({})).to.be.rejectedWith(Error, /SENDGRID_FROM/);
    });
    it('should set the from address', async function() {
      const testValue = 'Test Testerson <test@test.io>';
      process.env.SENDGRID_FROM = testValue;
      sgMail.send.restore();
      sandbox.stub(sgMail, 'send').returnsArg(0);
      const args = await ContactNotifier.send({ from: testValue });
      expect(args.from).to.equal(testValue);
    });
    it('should set BCC if present in env', async function() {
      const testValue = 'bcc@test.com';
      process.env.SENDGRID_BCC = testValue;
      sgMail.send.restore();
      sandbox.stub(sgMail, 'send').returnsArg(0);
      const args = await ContactNotifier.send({ bcc: testValue });
      expect(args.bcc).to.equal(testValue);
    });
  });

  describe('#sendInternalCampaignCreated', function() {
    let campaign;
    before(async function() {
      campaign = await createCampaign();
    });
    after(async function() {
      await CampaignRepo.remove();
    });

    beforeEach(function() {
      sandbox.stub(sgMail, 'setApiKey').resolves();
      sandbox.stub(sgMail, 'send').resolves();
      sandbox.spy(ContactNotifier, 'sendInternalCampaignCreated');
    });
    afterEach(function() {
      sandbox.restore();
    });

    it('should reject when passed no arguments', async function() {
      await expect(ContactNotifier.sendInternalCampaignCreated()).to.eventually.be.rejected;
      sinon.assert.calledOnce(ContactNotifier.sendInternalCampaignCreated);
    });
    it('should reject when passed no campaign', async function() {
      await expect(ContactNotifier.sendInternalCampaignCreated({ foo: 'bar' })).to.eventually.be.rejected;
      sinon.assert.calledOnce(ContactNotifier.sendInternalCampaignCreated);
    });
    it('should fulfill when passed a campaign', async function() {
      await expect(ContactNotifier.sendInternalCampaignCreated({ campaign })).to.eventually.be.fulfilled;
      sinon.assert.calledOnce(ContactNotifier.sendInternalCampaignCreated);
    });

  });

  describe('#sendExternalCampaignCreated', function() {
    let campaign;
    before(async function() {
      campaign = await createCampaign();
    });
    after(async function() {
      await CampaignRepo.remove();
    });

    beforeEach(function() {
      sandbox.stub(sgMail, "setApiKey").resolves();
      sandbox.stub(sgMail, "send").resolves();
      sandbox.spy(ContactNotifier, 'sendExternalCampaignCreated');
    });
    afterEach(function() {
      sandbox.restore();
    });

    it('should reject when passed no arguments', async function() {
      await expect(ContactNotifier.sendExternalCampaignCreated()).to.eventually.be.rejected;
      sinon.assert.calledOnce(ContactNotifier.sendExternalCampaignCreated);
    });
    it('should reject when passed no campaign', async function() {
      await expect(ContactNotifier.sendExternalCampaignCreated({ foo: 'bar' })).to.eventually.be.rejected;
      sinon.assert.calledOnce(ContactNotifier.sendExternalCampaignCreated);
    });
    it('should fulfill when passed a campaign', async function() {
      await expect(ContactNotifier.sendExternalCampaignCreated({ campaign })).to.eventually.be.fulfilled;
      sinon.assert.calledOnce(ContactNotifier.sendExternalCampaignCreated);
    });

  });
});
