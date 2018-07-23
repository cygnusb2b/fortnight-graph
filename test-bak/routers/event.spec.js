require('../connections');
const app = require('../../src/app');
const newrelic = require('../../src/newrelic');
const PlacementRepo = require('../../src/repositories/placement');
const CampaignRepo = require('../../src/repositories/campaign');
const EventHandler = require('../../src/services/event-handler');
const AnalyticsEvent = require('../../src/models/analytics/event');
const router = require('../../src/routers/event');
const sandbox = sinon.createSandbox();

const createPlacement = async () => {
  const result = await PlacementRepo.seed();
  return result.one();
}

const createCampaign = async () => {
  const result = await CampaignRepo.seed();
  return result.one();
}


const emptyGif = Buffer.from('R0lGODlhAQABAPAAAAAAAAAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==', 'base64');

const testImageResponse = (res) => {
  const headers = [
    { key: 'access-control-allow-origin', value: '*' },
    { key: 'content-type', value: 'image/gif' },
    { key: 'cache-control', value:'no-store, no-cache, must-revalidate' },
    { key: 'expires', value: 'Sun, 23 Mar 2003 06:00:00 GMT' },
    { key: 'last-modified', value: 'Sun, 23 Mar 2003 06:00:00 GMT' },
    { key: 'x-content-type-options', value: 'nosniff' },
    { key: 'pragma', value: 'no-cache' },
  ];
  headers.forEach(header => expect(res.get(header.key)).to.equal(header.value));
  expect(res.body.toString()).to.equal(emptyGif.toString());
};
const testErrorLogging = (res) => {
  sinon.assert.calledOnce(newrelic.noticeError);
};

describe('routers/event', function() {
  beforeEach(function() {
    sandbox.spy(newrelic, 'noticeError');
  });
  before(async function() {
    await AnalyticsEvent.remove();
  });
  afterEach(async function() {
    sandbox.restore();
    await AnalyticsEvent.remove();
  });
  it('should export a router function.', function(done) {
    expect(router).to.be.a('function');
    expect(router).itself.to.respondTo('use');
    done();
  });

  describe('/:action.gif', function() {
    let placement;
    let campaign;
    before(async function() {
      placement = await createPlacement();
      campaign = await createCampaign();
    });
    after(async function() {
      await PlacementRepo.remove();
      await CampaignRepo.remove();
      await AnalyticsEvent.remove();
    });
    beforeEach(function() {
      sandbox.spy(EventHandler, 'track');
    });
    afterEach(function() {
      sandbox.restore();
    });

    it('should respond to an event using GET.', async function() {
      const event = {
        uuid: '92e998a7-e596-4747-a233-09108938c8d4',
        pid: placement.id,
        cid: campaign.id,
      };
      await request(app)
        .get('/e/view.gif')
        .query(event)
        .expect(200)
        .expect(testImageResponse);
      sinon.assert.calledOnce(EventHandler.track);
    });

    it('should respond to an event using POST.', async function() {
      const event = {
        uuid: '92e998a7-e596-4747-a233-09108938c8d4',
        pid: placement.id,
        cid: campaign.id,
      };
      await request(app)
        .post('/e/view.gif')
        .query(event)
        .expect(200)
        .expect(testImageResponse);
      sinon.assert.calledOnce(EventHandler.track);
    });

    it('should even when an error condition would be found.', async function() {
      await request(app)
        .get('/e/view.gif')
        .expect(200)
        .expect(testImageResponse);
      sinon.assert.calledOnce(EventHandler.track);
    });

  });

});
