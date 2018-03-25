require('../connections');
const EventHandler = require('../../src/services/event-handler');
const BotDetector = require('../../src/services/bot-detector');
const PlacementRepo = require('../../src/repositories/placement');
const CampaignRepo = require('../../src/repositories/campaign');
const sandbox = sinon.createSandbox();

const createPlacement = async () => {
  const result = await PlacementRepo.seed();
  return result.one();
}

const createCampaign = async () => {
  const result = await CampaignRepo.seed();
  return result.one();
}

describe('services/event-handler', function() {
  describe('#track', function() {
    let placement;
    let campaign;
    before(async function() {
      placement = await createPlacement();
      campaign = await createCampaign();
    });
    after(async function() {
      await PlacementRepo.remove();
      await CampaignRepo.remove();
    });

    beforeEach(function() {
      sandbox.spy(BotDetector, 'detect');
    });
    afterEach(function() {
      sandbox.restore();
    });

    it('should reject when the action is invalid.', async function() {
      const promise = EventHandler.track({ action: 'bad-action' });
      await expect(promise).to.be.rejectedWith(Error, `The provided action 'bad-action' is not supported.`);
    });

    it('should reject when the pid is not provided.', async function() {
      const fields = {
        uuid: 'db1a4977-6ef8-4039-959d-99f95b839eae',
      };
      const promise = EventHandler.track({ action: 'view', fields });
      await expect(promise).to.be.rejectedWith(Error, `The provided pid '${fields.pid}' is invalid.`);
    });

    it('should reject when the pid is invalid.', async function() {
      const fields = {
        pid: '1234',
        uuid: 'db1a4977-6ef8-4039-959d-99f95b839eae',
      };
      const promise = EventHandler.track({ action: 'view', fields });
      await expect(promise).to.be.rejectedWith(Error, `The provided pid '1234' is invalid.`);
    });

    it('should reject when the uuid is not provided.', async function() {
      const fields = {
        pid: '5ab2b3c4b0997c0001c0c716',
      };
      const promise = EventHandler.track({ action: 'view', fields });
      await expect(promise).to.be.rejectedWith(Error, `The provided uuid '${fields.uuid}' is invalid.`);
    });

    it('should reject when the uuid is invalid.', async function() {
      const fields = {
        pid: '5ab2b3c4b0997c0001c0c716',
        uuid: 'db1a4977-6ef8-4039-959d',
      };
      const promise = EventHandler.track({ action: 'view', fields });
      await expect(promise).to.be.rejectedWith(Error, `The provided uuid 'db1a4977-6ef8-4039-959d' is invalid.`);
    });

    it('should reject when the cid is provided but is invalid.', async function() {
      const fields = {
        pid: '5ab2b3c4b0997c0001c0c716',
        uuid: 'db1a4977-6ef8-4039-959d-99f95b839eae',
        cid: '1234',
      };
      const promise = EventHandler.track({ action: 'view', fields });
      await expect(promise).to.be.rejectedWith(Error, `The provided cid '1234' is invalid.`);
    });

    it('should reject when the placement cannot be found.', async function() {
      const fields = {
        pid: '5ab2b3c4b0997c0001c0c716',
        uuid: 'db1a4977-6ef8-4039-959d-99f95b839eae',
      };
      const promise = EventHandler.track({ action: 'view', fields });
      await expect(promise).to.be.rejectedWith(Error, `No placement was found for id '${fields.pid}'`);
    });

    it('should reject when the campaign cannot be found.', async function() {
      const fields = {
        pid: placement.id,
        uuid: 'db1a4977-6ef8-4039-959d-99f95b839eae',
        cid: '5ab2b3c4b0997c0001c0c716'
      };
      const promise = EventHandler.track({ action: 'view', fields });
      await expect(promise).to.be.rejectedWith(Error, `No campaign was found for id '${fields.cid}'`);
    });

    it('should fulfill with a campaign', async function() {
      const fields = {
        pid: placement.id,
        uuid:'db1a4977-6ef8-4039-959d-99f95b839eae',
        cid: campaign.id,
      };
      const promise = EventHandler.track({ action: 'view', fields });
      await expect(promise).to.be.fulfilled;
      sinon.assert.calledOnce(BotDetector.detect);
    });

    it('should fulfill without a campaign', async function() {
      const fields = {
        pid: placement.id,
        uuid:'db1a4977-6ef8-4039-959d-99f95b839eae',
      };
      const promise = EventHandler.track({ action: 'view', fields });
      await expect(promise).to.be.fulfilled;
      sinon.assert.calledOnce(BotDetector.detect);
    });

  });
});
