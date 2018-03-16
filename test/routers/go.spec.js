require('../connections');
const app = require('../../src/app');
const CampaignPlacementRepo = require('../../src/repositories/campaign/placement');
const CampaignRepo = require('../../src/repositories/campaign');
const AnalyticsClick = require('../../src/models/analytics/click');
const AnalyticsBot = require('../../src/models/analytics/bot');
const router = require('../../src/routers/track');

const createCampaign = async () => {
  const results = await CampaignRepo.seed();
  return results.one();
};

const testNoCacheResponse = (res) => {
  const headers = [
    { key: 'cache-control', value:'no-store, no-cache, must-revalidate, proxy-revalidate' },
    { key: 'expires', value: '0' },
    { key: 'pragma', value: 'no-cache' },
  ];
  headers.forEach(header => expect(res.get(header.key)).to.equal(header.value));
};

describe('routers/go', function() {
  let campaign1;
  let campaign2;
  before(async function() {
    campaign1 = await createCampaign();
    campaign2 = await createCampaign();
    await AnalyticsClick.remove();
    await AnalyticsBot.remove();
  });
  after(async function() {
    await AnalyticsClick.remove();
    await CampaignRepo.remove();
    await AnalyticsBot.remove();
  });
  it('should export a router function.', function(done) {
    expect(router).to.be.a('function');
    expect(router).itself.to.respondTo('use');
    done();
  });
  it('should return a 403 when a bad token is provided.', function(done) {
    request(app)
      .get('/go/bad-token-value')
      .expect(403)
      .expect(testNoCacheResponse)
      .end(done);
  });
  it('should return a 500 on a bad database operation.', function(done) {
    const stub = sinon.stub(AnalyticsClick.prototype, 'aggregateSave').rejects(new Error('Bad stuff!'));

    const campaignId = '5a9db9fb9fb64eb206ddf848';
    const hash = '01f5c84a826ebc85b8abbe318b400ad3';
    const endpoint = CampaignPlacementRepo.createCampaignRedirect(campaignId, '', hash);
    request(app)
      .get(endpoint)
      .expect(500)
      .expect(testNoCacheResponse)
      .end(() => {
        sinon.assert.called(stub);
        stub.restore();
        done();
      });

  });
  it('should redirect to a fallback URL.', function(done) {

    const url = 'http://redirect-to-me.com';
    const hash = '01f5c84a826ebc85b8abbe318b400ad3';

    const endpoint = CampaignPlacementRepo.createFallbackRedirect(url, '', hash);
    request(app)
      .get(endpoint)
      .expect(301)
      .expect(testNoCacheResponse)
      .expect((res) => {
        expect(res.get('location')).to.equal(url);
      })
      .end(done);
  });
  it('and upsert another using the same fallback redirect.', function(done) {

    const url = 'http://redirect-to-me.com';
    const hash = '01f5c84a826ebc85b8abbe318b400ad3';

    const endpoint = CampaignPlacementRepo.createFallbackRedirect(url, '', hash);
    request(app)
      .get(endpoint)
      .expect(301)
      .expect(testNoCacheResponse)
      .expect((res) => {
        expect(res.get('location')).to.equal(url);
      })
      .end(done);
  });
  it('should redirect to another fallback URL (with a different hash).', function(done) {

    const url = 'http://redirect-to-me.com';
    const hash = '660095791f5d2264447ea840b08b1bd7';

    const endpoint = CampaignPlacementRepo.createFallbackRedirect(url, '', hash);
    request(app)
      .get(endpoint)
      .expect(301)
      .expect(testNoCacheResponse)
      .expect((res) => {
        expect(res.get('location')).to.equal(url);
      })
      .end(done);
  });
  it('should redirect to a campaign url.', function(done) {
    const campaignId = campaign1.id;
    const hash = '01f5c84a826ebc85b8abbe318b400ad3';

    const endpoint = CampaignPlacementRepo.createCampaignRedirect(campaignId, '', hash);
    request(app)
      .get(endpoint)
      .expect(301)
      .expect(testNoCacheResponse)
      .expect((res) => {
        expect(res.get('location')).to.equal(campaign1.url);
      })
      .end(done);
  });
  it('and upsert another using the same campaign redirect.', function(done) {
    const campaignId = campaign1.id;
    const hash = '01f5c84a826ebc85b8abbe318b400ad3';

    const endpoint = CampaignPlacementRepo.createCampaignRedirect(campaignId, '', hash);
    request(app)
      .get(endpoint)
      .expect(301)
      .expect(testNoCacheResponse)
      .expect((res) => {
        expect(res.get('location')).to.equal(campaign1.url);
      })
      .end(done);
  });
  it('should redirect to another campaign URL (with same hash).', function(done) {
    const campaignId = campaign2.id;
    const hash = '01f5c84a826ebc85b8abbe318b400ad3';

    const endpoint = CampaignPlacementRepo.createCampaignRedirect(campaignId, '', hash);
    request(app)
      .get(endpoint)
      .expect(301)
      .expect(testNoCacheResponse)
      .expect((res) => {
        expect(res.get('location')).to.equal(campaign2.url);
      })
      .end(done);
  });
  it('should redirect to a campaign url and track a bot.', async function() {
    const campaignId = campaign1.id;
    const hash = '01f5c84a826ebc85b8abbe318b400ad3';

    const endpoint = CampaignPlacementRepo.createCampaignRedirect(campaignId, '', hash);
    await request(app)
      .get(endpoint)
      .set('User-Agent', 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)')
      .expect(301)
      .expect(testNoCacheResponse)
      .expect((res) => {
        expect(res.get('location')).to.equal(campaign1.url);
      })
    await expect(AnalyticsBot.find({ e: 'click', hash, cid: campaignId })).to.eventually.be.an('array').with.property('length', 1);
  });

  it('should redirect when iat is still present', function(done) {
    const url = 'http://redirect-to-me.com';
    const hash = '01f5c84a826ebc85b8abbe318b400ad3';
    const endpoint = CampaignPlacementRepo.createFallbackRedirect(url, '', hash, false);

    request(app)
      .get(endpoint)
      .expect(301)
      .expect(testNoCacheResponse)
      .expect((res) => {
        expect(res.get('location')).to.equal(url);
      })
      .end(done);
  });

});
