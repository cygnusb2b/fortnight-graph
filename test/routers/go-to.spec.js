require('../connections');
const app = require('../../src/app');
const CampaignRepo = require('../../src/repositories/campaign');

describe('routers/go-to', function() {
  let campaign;
  before(async function() {
    promise = await CampaignRepo.seed();
    campaign = promise.one();
  })
  after(async function() {
    await CampaignRepo.remove();
  })
  describe('/campaign', function() {
    it('should redirect when given valid parameters', function(done) {
      const { id } = campaign;
      request(app)
        .get(`/go-to/campaign/${id}`)
        .expect(301)
        .end(done);
    });
  })
  describe('/collect', function() {
    it('should redirect when given valid parameters', function(done) {
      const { hash } = campaign;
      request(app)
        .get(`/go-to/collect/${hash}`)
        .expect(301)
        .end(done);
    });
  })
  describe('/report-summary', function() {
    it('should redirect when given valid parameters', function(done) {
      const { hash } = campaign;
      request(app)
        .get(`/go-to/report-summary/${hash}`)
        .expect(301)
        .end(done);
    });
  })
  describe('/report-creative-breakdown', function() {
    it('should redirect when given valid parameters', function(done) {
      const { hash } = campaign;
      request(app)
        .get(`/go-to/report-creative-breakdown/${hash}`)
        .expect(301)
        .end(done);
    });
  })
});
