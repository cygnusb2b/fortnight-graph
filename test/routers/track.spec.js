require('../connections');
const app = require('../../src/app');
const CampaignPlacementRepo = require('../../src/repositories/campaign/placement');
const AnalyticsLoad = require('../../src/models/analytics/load');
const AnalyticsView = require('../../src/models/analytics/view');
const router = require('../../src/routers/track');

const emptyGif = Buffer.from('R0lGODlhAQABAPAAAAAAAAAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==', 'base64');

const testImageResponse = (res) => {
  const headers = [
    { key: 'content-type', value: 'image/gif' },
    { key: 'cache-control', value:'no-store, no-cache, must-revalidate, proxy-revalidate' },
    { key: 'expires', value: '0' },
    { key: 'pragma', value: 'no-cache' },
  ];
  headers.forEach(header => expect(res.get(header.key)).to.equal(header.value));
  expect(res.body.toString()).to.equal(emptyGif.toString());
};
const testErrorHeader = (res) => {
  expect(res.get('X-Error-Message')).to.be.a('string');
};

describe('routers/track', function() {
  before(async function() {
    await AnalyticsLoad.remove();
    await AnalyticsView.remove();
  });
  after(async function() {
    await AnalyticsLoad.remove();
    await AnalyticsView.remove();
  });
  it('should export a router function.', function(done) {
    expect(router).to.be.a('function');
    expect(router).itself.to.respondTo('use');
    done();
  });
  it('should return a 400 when the event is not supported.', function(done) {
    request(app)
      .get('/t/bad-token-value/bad-event.gif')
      .expect(400)
      .expect(testImageResponse)
      .expect(testErrorHeader)
      .end(done);
  });
  it('should return a 403 when a bad token is provided.', function(done) {
    request(app)
      .get('/t/bad-token-value/view.gif')
      .expect(403)
      .expect(testImageResponse)
      .expect(testErrorHeader)
      .end(done);
  });
  it('should return a 404 if the image extension is missing.', function(done) {
    request(app)
      .get('/t/token/view')
      .expect(404)
      .end(done);
  });
  it('should return a 500 on a bad database operation.', function(done) {
    const stub = sinon.stub(AnalyticsLoad.prototype, 'aggregateSave').rejects(new Error('Bad stuff!'));

    const campaignId = '5a9db9fb9fb64eb206ddf848';
    const hash = '01f5c84a826ebc85b8abbe318b400ad3';
    const endpoint = CampaignPlacementRepo.createTracker('load', campaignId, '', hash);
    request(app)
      .get(endpoint)
      .expect(500)
      .expect(testImageResponse)
      .expect(testErrorHeader)
      .end(() => {
        sinon.assert.called(stub);
        stub.restore();
        done();
      });

  });
  it('should respond to the load event.', function(done) {
    const campaignId = '5a9db9fb9fb64eb206ddf848';
    const hash = '01f5c84a826ebc85b8abbe318b400ad3';
    const endpoint = CampaignPlacementRepo.createTracker('load', campaignId, '', hash);
    request(app)
      .get(endpoint)
      .expect(200)
      .expect(testImageResponse)
      .end(done);
  });
  it('and upsert another load event.', function(done) {
    const campaignId = '5a9db9fb9fb64eb206ddf848';
    const hash = '01f5c84a826ebc85b8abbe318b400ad3';
    const endpoint = CampaignPlacementRepo.createTracker('load', campaignId, '', hash);
    request(app)
      .get(endpoint)
      .expect(200)
      .expect(testImageResponse)
      .end(done);
  });
  it('should respond to the view event.', function(done) {
    const campaignId = '5a9db9fb9fb64eb206ddf848';
    const hash = '01f5c84a826ebc85b8abbe318b400ad3';
    const endpoint = CampaignPlacementRepo.createTracker('view', campaignId, '', hash);
    request(app)
      .get(endpoint)
      .expect(200)
      .expect(testImageResponse)
      .end(done);
  });
  it('and upsert another view event.', function(done) {
    const campaignId = '5a9db9fb9fb64eb206ddf848';
    const hash = '01f5c84a826ebc85b8abbe318b400ad3';
    const endpoint = CampaignPlacementRepo.createTracker('view', campaignId, '', hash);
    request(app)
      .get(endpoint)
      .expect(200)
      .expect(testImageResponse)
      .end(done);
  });
});
