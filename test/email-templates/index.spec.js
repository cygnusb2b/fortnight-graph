/* eslint-disable no-undef */
require('../connections');
const EmailTemplates = require('../../src/email-templates');

const sandbox = sinon.createSandbox();

describe('email-templates/index', () => {
  describe('#render', () => {
    beforeEach(async () => {
      sandbox.spy(EmailTemplates, 'readFileAsync');
    });
    afterEach(async () => {
      sandbox.restore();
    });
    it('should error when the requested file does not exist', async () => {
      await expect(EmailTemplates.render('does-not-exist')).to.eventually.be.rejectedWith(Error, 'no such file or directory');
    });
    it('should return the requested template', async () => {
      const promise = EmailTemplates.render('internal/campaign.created');
      await expect(promise).to.eventually.be.fulfilled;
      const template = await promise;
      expect(template).to.be.a('string');
      sinon.assert.calledOnce(EmailTemplates.readFileAsync);
    });
    it('should return subsequent templates from cache', async () => {
      const promise = EmailTemplates.render('internal/campaign.created');
      const template = await promise;
      expect(template).to.be.a('string');
      sinon.assert.notCalled(EmailTemplates.readFileAsync);
    });
  });
});
