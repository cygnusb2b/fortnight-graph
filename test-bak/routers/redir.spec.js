require('../connections');
const jwt = require('jsonwebtoken');
const app = require('../../src/app');
const CampaignDeliveryRepo = require('../../src/repositories/campaign/delivery');
const CampaignRepo = require('../../src/repositories/campaign');
const AnalyticsEvent = require('../../src/models/analytics/event');
const router = require('../../src/routers/redir');

const createCampaign = async () => {
  const results = await CampaignRepo.seed();
  return results.one();
};

const testNoCacheResponse = (res) => {
  const headers = [
    { key: 'cache-control', value:'no-store, no-cache, must-revalidate' },
    { key: 'expires', value: 'Sun, 23 Mar 2003 06:00:00 GMT' },
    { key: 'last-modified', value: 'Sun, 23 Mar 2003 06:00:00 GMT' },
    { key: 'x-content-type-options', value: 'nosniff' },
    { key: 'pragma', value: 'no-cache' },
  ];
  headers.forEach(header => expect(res.get(header.key)).to.equal(header.value));
};

describe('routers/redir', function() {
  let campaign;
  before(async function() {
    campaign1 = await createCampaign();
    await AnalyticsEvent.remove();
  });
  after(async function() {
    await CampaignRepo.remove();
  });
  afterEach(async function() {
    await AnalyticsEvent.remove();
  });
  it('should export a router function.', function(done) {
    expect(router).to.be.a('function');
    expect(router).itself.to.respondTo('use');
    done();
  });
  it('should return a 500 when a bad token is provided.', function(done) {
    request(app)
      .get('/redir/bad-token-value')
      .expect(500)
      .expect(testNoCacheResponse)
      .end(done);
  });
  it('should redirect to a fallback URL.', async function() {

    const url = 'http://redirect-to-me.com';
    const event = {
      uuid: '92e998a7-e596-4747-a233-09108938c8d3',
      pid: '5a9db9fb9fb64eb206ddf84a',
      cid: '5a9db9fb9fb64eb206ddf848',
    }

    const { uuid, pid, cid } = event;
    const payload = {
      uuid,
      pid,
      cid,
      url,
    };
    const token = jwt.sign(payload, 'somesecret', { noTimestamp: true });
    const endpoint = `/redir/${token}`;

    await request(app)
      .get(endpoint)
      .set('User-Agent', 'Mozilla/5.0 (Windows NT 6.0; WOW64; rv:52.0) Gecko/20100101 Firefox/52.0')
      .expect(301)
      .expect(testNoCacheResponse)
      .expect((res) => {
        expect(res.get('location')).to.equal(url);
      });
  });

  it('should redirect to a campaign url.', async function() {
    const event = {
      uuid: '92e998a7-e596-4747-a233-09108938c8d4',
      pid: '5a9db9fb9fb64eb206ddf84a',
      cid: campaign1.id,
    }

    const endpoint = CampaignDeliveryRepo.createCampaignRedirect('', event);
    await request(app)
      .get(endpoint)
      .set('User-Agent', 'Mozilla/5.0 (Windows NT 6.0; WOW64; rv:52.0) Gecko/20100101 Firefox/52.0')
      .expect(301)
      .expect(testNoCacheResponse)
      .expect((res) => {
        expect(res.get('location')).to.equal(campaign1.url);
      });
  });
});
