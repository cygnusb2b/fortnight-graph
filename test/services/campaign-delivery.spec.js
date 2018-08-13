const campaignDelivery = require('../../src/services/campaign-delivery');
const accountService = require('../../src/services/account');
const { Publisher, Story } = require('../../src/models');

const sandbox = sinon.createSandbox();


describe('services/campaign-delivery', function() {
  describe('#getClickUrl', function() {
    beforeEach(function() {
      sandbox.stub(accountService, 'retrieve').resolves({
        storyUri: 'https://www.google.com',
      });

      sandbox.stub(Story, 'findById').resolves({
        path: 'foo/bar',
      });

      sandbox.stub(Publisher, 'findById')
        .withArgs('1234').resolves({ id: '1234' })
        .withArgs('5678').resolves({ id: '5678', customUri: 'https://www.msn.com' })
      ;
    });

    afterEach(function() {
      sandbox.restore();
    });

    it('should return the provided `url` when no `storyId` is set.', async function() {
      await expect(campaignDelivery.getClickUrl({ url: 'http://www.foo.com' })).to.eventually.equal('http://www.foo.com');
      sandbox.assert.notCalled(accountService.retrieve);
    });
    it('should return the account based URI', async function() {
      await expect(campaignDelivery.getClickUrl({ storyId: '1234' }, { publisherId: '1234' }))
        .to.eventually.equal('https://www.google.com/foo/bar/?pubid=1234')
      ;
    });
    it('should return the publisher based URI', async function() {
      await expect(campaignDelivery.getClickUrl({ storyId: '1234' }, { publisherId: '5678' }))
        .to.eventually.equal('https://www.msn.com/foo/bar/?pubid=5678')
      ;
    });
  });
});
