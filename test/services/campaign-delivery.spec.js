const campaignDelivery = require('../../src/services/campaign-delivery');
const accountService = require('../../src/services/account');
const { Publisher, Story } = require('../../src/models');

const sandbox = sinon.createSandbox();


describe('services/campaign-delivery', function() {
  describe('#calculateImpressionReserve', function() {
    it('should return zero when no settings exist', function() {
      const account = { get: () => null };
      const placement = { get: () => null };
      const reservePct = campaignDelivery.calculateImpressionReserve({ account, placement });
      expect(reservePct).to.equal(0);
    });
    it('should return the account setting when no placement setting exists', function() {
      const account = { get: () => 30 };
      const placement = { get: () => null };
      const reservePct = campaignDelivery.calculateImpressionReserve({ account, placement });
      expect(reservePct).to.equal(0.3);
    });
    it('should return the placement setting when set to a number', function() {
      const account = { get: () => 33 };
      const placement = { get: () => 10 };
      const reservePct = campaignDelivery.calculateImpressionReserve({ account, placement });
      expect(reservePct).to.equal(0.1);
    });
    it('should return the placement setting when set to zero', function() {
      const account = { get: () => 33 };
      const placement = { get: () => 0 };
      const reservePct = campaignDelivery.calculateImpressionReserve({ account, placement });
      expect(reservePct).to.equal(0);
    });
  });
  describe('#getClickUrl', function() {
    beforeEach(function() {
      sandbox.stub(accountService, 'retrieve').resolves({
        storyUri: 'https://www.google.com',
      });

      sandbox.stub(Story, 'findById').resolves({
        getPath: () => Promise.resolve('foo/bar'),
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
      await expect(campaignDelivery.getClickUrl({ id: 'campaign-id', storyId: '1234' }, { id: 'placement-id', publisherId: '1234' }, { id: 'creative-id' }))
        .to.eventually.equal('https://www.google.com/foo/bar/?pubid=1234&utm_source=NativeX&utm_medium=banner&utm_campaign=campaign-id&utm_term=placement-id&utm_content=creative-id')
      ;
    });
    it('should return the publisher based URI', async function() {
      await expect(campaignDelivery.getClickUrl({ id: 'campaign-id', storyId: '1234' }, { id: 'placement-id', publisherId: '5678' }, { id: 'creative-id' }))
        .to.eventually.equal('https://www.msn.com/foo/bar/?pubid=5678&utm_source=NativeX&utm_medium=banner&utm_campaign=campaign-id&utm_term=placement-id&utm_content=creative-id')
      ;
    });
  });
});
