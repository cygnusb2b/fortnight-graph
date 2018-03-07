require('../../connections');
const { URL } = require('url');
const jwt = require('jsonwebtoken');
const uuidUtil = require('../../../src/utils/uuid');
const Repo = require('../../../src/repositories/campaign/placement');
const AnalyticsRequest = require('../../../src/models/analytics/request');
const AnalyticsRequestObject = require('../../../src/models/analytics/request-object');
const CampaignRepo = require('../../../src/repositories/campaign');
const PlacementRepo = require('../../../src/repositories/placement');
const TemplateRepo = require('../../../src/repositories/template');
const sandbox = sinon.createSandbox();

const createCampaign = async () => {
  const results = await CampaignRepo.seed();
  return results.one();
};

const createPlacement = async () => {
  const results = await PlacementRepo.seed();
  return results.one();
}

const createTemplate = async () => {
  const results = await TemplateRepo.seed();
  return results.one();
}

describe('repositories/campaign/placement', function() {
  before(async function() {
    await CampaignRepo.remove();
    await PlacementRepo.remove();
    await TemplateRepo.remove();
  });
  after(async function() {
    await CampaignRepo.remove();
    await PlacementRepo.remove();
    await TemplateRepo.remove();
  });
  it('should export an object.', function(done) {
    expect(Repo).to.be.an('object');
    done();
  });

  describe('#parseOptions', function() {
    [null, undefined, '', 'somestring', 0].forEach((value) => {
      it(`should return an object when the options are '${value}'.`, function(done) {
        expect(Repo.parseOptions(value)).to.be.an('object');
        done();
      });
    });
    it('should parse the options', function(done) {
      expect(Repo.parseOptions('{"foo":"bar"}')).to.deep.equal({ foo: 'bar' });
      done();
    });
  });

  describe('#createCampaignRedirect', function() {
    it('should return the redirect URL.', function(done) {
      const url = Repo.createCampaignRedirect('1234', 'http://foo.com', 'abcd');

      expect(url).to.match(/^http:\/\/foo\.com\/go\/.*$/);
      const parsed = new URL(url);
      const parts = parsed.pathname.split('/');
      const token = parts.pop();
      expect(token).to.be.a('string');

      // Check payload, but not sig here.
      const decoded = jwt.decode(token);
      expect(decoded).to.be.an('object');
      expect(decoded.iat).to.be.a('number').gt(0);
      expect(decoded.hash).to.equal('abcd');
      expect(decoded.cid).to.equal('1234');
      done();
    });
  });

  describe('#createFallbackRedirect', function() {
    [undefined, '', '/foo/path.jpg', 'www.google.com', null].forEach((value) => {
      it(`should pass the URL back, as-is, when the url value is '${value}'`, function(done) {
        expect(Repo.createFallbackRedirect(value)).to.equal(value);
        done();
      });
    });

    it('should return the fallback redirect URL.', function(done) {
      const url = Repo.createFallbackRedirect('http://www.redirect-to.com', 'http://foo.com', 'abcd');

      expect(url).to.match(/^http:\/\/foo\.com\/go\/.*$/);
      const parsed = new URL(url);
      const parts = parsed.pathname.split('/');
      const token = parts.pop();
      expect(token).to.be.a('string');

      // Check payload, but not sig here.
      const decoded = jwt.decode(token);
      expect(decoded).to.be.an('object');
      expect(decoded.iat).to.be.a('number').gt(0);
      expect(decoded.hash).to.equal('abcd');
      expect(decoded.url).to.equal('http://www.redirect-to.com');
      done();
    });

  });

  describe('#fillWithFallbacks', function() {
    it('should leave campaign array untouched when length is >= limit', function(done) {
      const campaigns = [{ id: '1234' }];
      Repo.fillWithFallbacks(campaigns, 1);
      expect(campaigns).deep.equal([{ id: '1234' }]);
      done();
    });
    it('should fill with the extra, empty campaigns', function(done) {
      const campaigns = [{ id: '1234' }];
      Repo.fillWithFallbacks(campaigns, 3);
      expect(campaigns).deep.equal([{ id: '1234' }, { id: null }, { id: null }]);
      done();
    });
  });

  describe('#createEmptyAd', function() {
    it('should return an empty ad object.', function (done) {
      const expected = {
        campaignId: '1234',
        creativeId: null,
        fallback: true,
        html: '',
      };
      expect(Repo.createEmptyAd('1234')).to.deep.equal(expected);
      done();
    });
    ['', undefined, null].forEach((value) => {
      it(`should return an empty ad object with a null campaignId when the id value is '${value}'.`, function(done) {
        const expected = {
          campaignId: null,
          creativeId: null,
          fallback: true,
          html: '',
        };
        expect(Repo.createEmptyAd(value)).to.deep.equal(expected);
        done();
      });
    });
  });

  describe('#buildFallbackFor', function() {
    ['', undefined, null, false].forEach((fallback) => {
      it(`should return an empty ad object when the template fallback is '${fallback}'`, function (done) {
        const campaignId = '1234';
        const hash = 'abc';
        const requestURL = 'http://www.foo.com';
        const template = { fallback };

        const trackers = Repo.createTrackers(campaignId, requestURL, hash);
        const beacon = Repo.createImgBeacon(trackers);

        const expected = {
          campaignId,
          creativeId: null,
          fallback: true,
        };
        const result = Repo.buildFallbackFor(campaignId, template, undefined, requestURL, hash);
        expect(result).to.be.an('object');
        ['campaignId, creativeId, fallback'].forEach(k => expect(result[k]).to.equal(expected[k]));
        expect(result.html).to.match(/^<div data-app="fortnight" data-type="placement"><img src="http:\/\/www\.foo\.com\/t\/.*<\/div>/i);
        done();
      });
    });

    it('should render the ad with the fallback template and vars.', function(done) {
      const campaignId = '1234';
      const template = { fallback: '<div>{{ var }}</div>' };
      const expected = {
        campaignId,
        creativeId: null,
        fallback: true,
        html: '<div>Variable here!</div>',
      };
      const fallbackVars = { var: 'Variable here!' };
      const result = Repo.buildFallbackFor(campaignId, template, fallbackVars);
      expect(result).to.be.an('object');
      ['campaignId, creativeId, fallback'].forEach(k => expect(result[k]).to.equal(expected[k]));
      done();
    });

    it('should render the ad with the fallback template and beacon.', function(done) {
      const campaignId = '1234';
      const hash = 'abc';
      const requestURL = 'http://www.foo.com';

      const trackers = Repo.createTrackers(campaignId, requestURL, hash);
      const beacon = Repo.createImgBeacon(trackers);

      const template = { fallback: '<div>{{ foo }}</div>{{{ beacon }}}' };
      const expected = {
        campaignId,
        creativeId: null,
        fallback: true,
      };
      const fallbackVars = { foo: 'Variable here!' };

      const result = Repo.buildFallbackFor(campaignId, template, fallbackVars, requestURL, hash);
      expect(result).to.be.an('object');
      ['campaignId, creativeId, fallback'].forEach(k => expect(result[k]).to.equal(expected[k]));
      expect(result.html).to.match(/^<div>Variable here!<\/div><div data-app="fortnight" data-type="placement"><img src="http:\/\/www\.foo\.com\/t\/.*<\/div>/i);
      done();
    });

  });

  describe('#buildAdFor', function() {
    let campaign;
    beforeEach(function() {
      sandbox.spy(Repo, 'createFallbackRedirect');
      sandbox.spy(Repo, 'createCampaignRedirect');
    });
    afterEach(function() {
      sandbox.restore();
    });
    before(async function() {
      campaign = await createCampaign();
      campaign.set('creatives', []);
    });

    it('should build a fallback when the creatives are empty.', function(done) {
      const template = { fallback: null };
      const expected = {
        campaignId: campaign.id,
        creativeId: null,
        fallback: true,
      };
      const result = Repo.buildAdFor(campaign, template);
      expect(result).to.be.an('object');
      ['campaignId, creativeId, fallback'].forEach(k => expect(result[k]).to.equal(expected[k]));
      expect(result.html).to.match(/^<div data-app="fortnight" data-type="placement"><img src=.*/i);
      sinon.assert.notCalled(Repo.createFallbackRedirect);
      done();
    });

    ['', null, undefined].forEach((value) => {
      it(`should build a fallback when the campaign id value is '${value}'`, function(done) {
        const campaign = { id: value };
        const template = {
          html: '<div>{{ campaign.id }}</div><span>{{ creative.id }}</span>',
          fallback: '<div>{{ fallback }}</div>',
        };
        const fallbackVars = { fallback: 'Fallback!' };
        const expected = {
          campaignId: null,
          creativeId: null,
          fallback: true,
          html: '<div>Fallback!</div>',
        };
        expect(Repo.buildAdFor(campaign, template, fallbackVars)).to.deep.equal(expected);
        sinon.assert.calledOnce(Repo.createFallbackRedirect);
        done();
      });
    });

    it('should build the rendered ad object.', function(done) {
      campaign.set('creatives.0', {});

      const creative = campaign.get('creatives.0');

      const template = { html: '<div>{{ campaign.id }}</div><span>{{ creative.id }}</span>' };
      const expected = {
        campaignId: campaign.id,
        creativeId: creative.id,
        fallback: false,
        html: `<div>${campaign.id}</div><span>${creative.id}</span>`,
      };
      expect(Repo.buildAdFor(campaign, template)).to.deep.equal(expected);
      sinon.assert.calledOnce(Repo.createCampaignRedirect);
      done();
    });

  });

  describe('#createImgBeacon', function() {
    it('should return the tracker HMTL snippet.', function(done) {
      const expected = '<div data-app="fortnight" data-type="placement"><img src="http://foo.com/l" data-view-src="http://foo.com/v"></div>';
      expect(Repo.createImgBeacon({ load: 'http://foo.com/l', view: 'http://foo.com/v' })).to.equal(expected);
      done();
    });
  });

  describe('#createTrackedHTML', function() {
    it('should return the tracker HMTL snippet.', function(done) {
      const expected = `<div>Some ad HTML</div>\n<div data-app="fortnight" data-type="placement"><img src="http://foo.com/l" data-view-src="http://foo.com/v"></div>`;
      const ad = {
        html: '<div>Some ad HTML</div>',
        trackers: { load: 'http://foo.com/l', view: 'http://foo.com/v' },
      }
      expect(Repo.createTrackedHTML(ad)).to.equal(expected);
      done();
    });
  });

  describe('#createTracker', function() {
    it('should create the URL.', function(done) {
      const url = Repo.createTracker('view', 1234, 'http://www.foo.com', 'abcde');
      expect(url).to.match(/^http:\/\/www\.foo\.com\/t\/.*\/view\.gif$/);
      const parsed = new URL(url);
      const parts = parsed.pathname.split('/');
      parts.pop();
      const token = parts.pop();
      expect(token).to.be.a('string');
      // Check payload, but not sig here.
      const decoded = jwt.decode(token);
      expect(decoded).to.be.an('object');
      expect(uuidUtil.is(decoded.id)).to.be.true;
      expect(decoded.iat).to.be.a('number').gt(0);
      expect(decoded.exp).to.be.a('number').gt(0);
      expect(decoded.hash).to.equal('abcde');
      expect(decoded.cid).to.equal(1234);

      done();
    });
    it('should create the URL when the campaignId is empty', function(done) {
      const url = Repo.createTracker('view', null, 'http://www.foo.com', 'abcde');
      expect(url).to.match(/^http:\/\/www\.foo\.com\/t\/.*\/view\.gif$/);
      const parsed = new URL(url);
      const parts = parsed.pathname.split('/');
      parts.pop();
      const token = parts.pop();
      expect(token).to.be.a('string');
      // Check payload, but not sig here.
      const decoded = jwt.decode(token);
      expect(decoded).to.be.an('object');
      expect(uuidUtil.is(decoded.id)).to.be.true;
      expect(decoded.iat).to.be.a('number').gt(0);
      expect(decoded.exp).to.be.a('number').gt(0);
      expect(decoded.hash).to.equal('abcde');
      expect(decoded.cid).to.equal(undefined);

      done();
    });
    it('should create unique ids with the same params.', function(done) {
      const url1 = Repo.createTracker('view', null, 'http://www.foo.com', 'abcde');
      const parsed1 = new URL(url1);
      const parts1 = parsed1.pathname.split('/');
      parts1.pop();
      const token1 = parts1.pop();
      const decoded1 = jwt.decode(token1);

      const url2 = Repo.createTracker('view', null, 'http://www.foo.com', 'abcde');
      const parsed2 = new URL(url2);
      const parts2 = parsed2.pathname.split('/');
      parts2.pop();
      const token2 = parts2.pop();
      const decoded2 = jwt.decode(token2);

      expect(decoded1.id).to.not.equal(decoded2.id);
      done();
    });
  });

  describe('#appendTrackers', function() {
    it('should append trackers to the ad object.', function(done) {
      const ad = { campaignId: '1234' };
      const tracked = Repo.appendTrackers(ad, 'http://www.foo.com', 'abc');
      expect(tracked).to.be.an('object');
      expect(tracked.campaignId).to.equal(ad.campaignId);
      expect(tracked.trackers.load).to.match(/^http:\/\/www\.foo\.com\/t\/.*\/load\.gif$/);
      expect(tracked.trackers.view).to.match(/^http:\/\/www\.foo\.com\/t\/.*\/view\.gif$/);
      done();
    });
    it('but not manipulate the incoming object', function(done) {
      const ad = { campaignId: '1234' };
      const tracked = Repo.appendTrackers(ad, 'http://www.foo.com', 'abc');
      expect(ad).to.have.all.keys('campaignId');
      expect(tracked).to.have.all.keys('campaignId', 'trackers');
      done();
    });
  });

  describe('#findFor', function() {
    const requestURL = 'https://somedomain.com';

    beforeEach(function() {
      sandbox.spy(Repo, 'buildAdFor');
      sandbox.spy(Repo, 'createTrackers');
      sandbox.spy(Repo, 'createImgBeacon');
    });
    afterEach(function() {
      sandbox.restore();
    });

    let placement;
    let template;
    before(async function() {
      placement = await createPlacement();
      template = await createTemplate();
      await AnalyticsRequestObject.remove();
      await AnalyticsRequest.remove();
    });
    it('should throw a not implemented error if greater than 1', async function() {
      const placementId = placement.id;
      const templateId = template.id;
      const num = 2;
      await expect(Repo.findFor({ placementId, templateId, requestURL, num })).to.be.rejectedWith(Error, 'Requesting more than one ad in a request is not yet implemented');
    });
    it('should should record the proper request analytics.', async function() {
      const placementId = placement.id;
      const templateId = template.id;
      // const num = 3;
      const num = 1;
      await expect(Repo.findFor({ placementId, templateId, requestURL, num })).to.be.fulfilled;
      const obj = await AnalyticsRequestObject.findOne({ pid: placementId });
      expect(obj).to.be.an('object');
      const request = await AnalyticsRequest.findOne({ hash: obj.hash });
      // expect(request.n).to.equal(3);
      expect(request.n).to.equal(1);
      sinon.assert.called(Repo.buildAdFor);
      sinon.assert.called(Repo.createTrackers);
      sinon.assert.called(Repo.createImgBeacon);
    });
    it('should reject when no params are sent', async function() {
      await expect(Repo.findFor()).to.be.rejectedWith(Error);
    });
    it('should reject when no request URL is provided.', async function() {
      const placementId = placement.id;
      const templateId = template.id;
      await expect(Repo.findFor({ placementId, templateId, requestURL: '' })).to.be.rejectedWith(Error);
    });
    [null, undefined, ''].forEach((placementId) => {
      it(`should reject when the placementId is '${placementId}'.`, async function() {
        const templateId = template.id;
        await expect(Repo.findFor({ placementId, requestURL })).to.be.rejectedWith(Error, 'No placement ID was provided.');
      });
    });
    [null, undefined, ''].forEach((templateId) => {
      it(`should reject when the templateId is '${templateId}'.`, async function() {
        const placementId = placement.id;
        await expect(Repo.findFor({ placementId, templateId, requestURL })).to.be.rejectedWith(Error, 'No template ID was provided.');
      });
    });
    it('should reject when no placement could be found.', async function() {
      const placementId = '507f1f77bcf86cd799439011';
      const templateId = template.id;
      await expect(Repo.findFor({ placementId, templateId, requestURL })).to.be.rejectedWith(Error, `No placement exists for ID '${placementId}'`);
    });
    it('should reject when no template could be found.', async function() {
      const placementId = placement.id;
      const templateId = '507f1f77bcf86cd799439011';
      await expect(Repo.findFor({ placementId, templateId, requestURL })).to.be.rejectedWith(Error, `No template exists for ID '${templateId}'`);
    });
    it('should reject when the num is higher than 10.', async function() {
      const placementId = placement.id;
      const templateId = template.id;
      const num = 11;
      await expect(Repo.findFor({ placementId, templateId, num, requestURL })).to.be.rejectedWith(Error, 'You cannot return more than 10 ads in one request.');
    });
    it('should fulfill when no campaigns are found, but still have the correct length and ad objects.', async function() {
      await CampaignRepo.remove();
      const placementId = placement.id;
      const templateId = template.id;
      // const num = 3;
      const num = 1;
      const promise = Repo.findFor({ placementId, templateId, requestURL, num });
      await expect(promise).to.be.fulfilled.and.eventually.be.an('array').with.property('length', 1);
      const ads = await promise;
      ads.forEach((ad) => {
        expect(ad).to.be.an('object').with.all.keys('campaignId', 'creativeId', 'fallback', 'html');
      });
      sinon.assert.called(Repo.buildAdFor);
      sinon.assert.called(Repo.createTrackers);
      sinon.assert.called(Repo.createImgBeacon);
    });
    it('should fulfill when a campaign is found.', async function() {
      await CampaignRepo.remove();
      const placementId = placement.id;
      const templateId = template.id;
      const num = 1;
      const campaign = await createCampaign();
      await expect(Repo.findFor({ placementId, templateId, num, requestURL })).to.be.fulfilled.and.eventually.be.an('array').with.property('length', 1);
      sinon.assert.called(Repo.buildAdFor);
      sinon.assert.called(Repo.createTrackers);
      sinon.assert.called(Repo.createImgBeacon);
      await CampaignRepo.remove();
    });
    it('should fulfill when a campaign is found, and fallbacks are present.', async function() {
      await CampaignRepo.remove();
      const placementId = placement.id;
      const templateId = template.id;
      // const num = 3;
      const num = 1;
      const campaign = await createCampaign();
      await expect(Repo.findFor({ placementId, templateId, num, requestURL })).to.be.fulfilled.and.eventually.be.an('array').with.property('length', 1);
      sinon.assert.called(Repo.buildAdFor);
      sinon.assert.called(Repo.createTrackers);
      sinon.assert.called(Repo.createImgBeacon);
      await CampaignRepo.remove();
    });
    [undefined, 0, -1, 1, null, '1'].forEach((num) => {
      it(`should fulfill with a single campaign when num is ${num}`, async function() {
        const placementId = placement.id;
        const templateId = template.id;
        await createCampaign();
        await createCampaign();
        await expect(Repo.findFor({ placementId, templateId, num, requestURL })).to.be.fulfilled.and.eventually.be.an('array').with.property('length', 1);
        sinon.assert.called(Repo.buildAdFor);
      sinon.assert.called(Repo.createTrackers);
      sinon.assert.called(Repo.createImgBeacon);
        await CampaignRepo.remove();
      });
    });

  });

});
