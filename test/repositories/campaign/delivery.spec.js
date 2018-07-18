require('../../connections');
const moment = require('moment');
const Promise = require('bluebird');
const { URL } = require('url');
const jwt = require('jsonwebtoken');
const Repo = require('../../../src/repositories/campaign/delivery');
const CampaignRepo = require('../../../src/repositories/campaign');
const AdvertiserRepo = require('../../../src/repositories/advertiser');
const PlacementRepo = require('../../../src/repositories/placement');
const TemplateRepo = require('../../../src/repositories/template');
const AnalyticsEvent = require('../../../src/models/analytics/event');
const Utils = require('../../../src/utils');
const sandbox = sinon.createSandbox();

const createAdvertiser = async () => {
  const results = await AdvertiserRepo.seed();
  return results.one();
};

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

describe('repositories/campaign/delivery', function() {
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

  describe('#getPlacementAndTemplate', function() {
    let placement;
    let template;
    before(async function() {
      placement = await createPlacement();
      template = await createTemplate();
    });
    after(async function() {
      await PlacementRepo.remove();
      await TemplateRepo.remove();
    });

    it('should reject when no params are sent', async function() {
      await expect(Repo.getPlacementAndTemplate()).to.be.rejectedWith(Error);
    });
    [null, undefined, ''].forEach((placementId) => {
      it(`should reject when the placementId is '${placementId}'.`, async function() {
        const templateId = template.id;
        await expect(Repo.getPlacementAndTemplate({ templateId })).to.be.rejectedWith(Error, 'No placement ID was provided.');
      });
    });
    [null, undefined, ''].forEach((templateId) => {
      it(`should reject when the templateId is '${templateId}'.`, async function() {
        const placementId = placement.id;
        await expect(Repo.getPlacementAndTemplate({ placementId })).to.be.rejectedWith(Error, 'No template ID was provided.');
      });
    });
    it('should reject when no placement could be found.', async function() {
      const placementId = '507f1f77bcf86cd799439011';
      const templateId = template.id;
      await expect(Repo.getPlacementAndTemplate({ placementId, templateId })).to.be.rejectedWith(Error, `No placement exists for ID '${placementId}'`);
    });
    it('should reject when no template could be found.', async function() {
      const placementId = placement.id;
      const templateId = '507f1f77bcf86cd799439011';
      await expect(Repo.getPlacementAndTemplate({ placementId, templateId })).to.be.rejectedWith(Error, `No template exists for ID '${templateId}'`);
    });
    it('should fulfill with the placement and template.', async function() {
      const placementId = placement.id;
      const templateId = template.id;

      const promise = Repo.getPlacementAndTemplate({ placementId, templateId });
      await expect(promise).to.eventually.be.an('object');
      const result = await promise;
      expect(result.placement.id).to.equal(placementId);
      expect(result.template.id).to.equal(templateId);
    });
  });

  describe('#createRequestEvent', function() {
    it('should create the request event.', function(done) {
      const params = {
        e: 'view',
        uuid: '1234',
        bot: 'foo',
        pid: '5aa03a87be66ee000110c13b',
        cid: '5aabc20d62a17f0001bbcba4',
        ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3325.162 Safari/537.36',
        kv: {
          foo: 'bar',
        },
      };
      const event = Repo.createRequestEvent(params);
      expect(event).to.be.an.instanceOf(AnalyticsEvent);
      expect(event.e).to.equal('request');
      expect(event.uuid).to.match(/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/);
      expect(event.cid.toString()).to.equal(params.cid);
      expect(event.pid.toString()).to.equal(params.pid);
      expect(event.d).to.be.an.instanceOf(Date);
      expect(event.bot.detected).to.be.false;
      expect(event.ua.ua).to.equal(params.ua);
      expect(event.kv).to.deep.equal(params.kv);
      done();
    });
    it('should set the cid to undefined if not present.', function(done) {
      const params = {
        pid: '5aa03a87be66ee000110c13b',
        cid: '',
      };
      const event = Repo.createRequestEvent(params);
      expect(event.cid).to.be.undefined;
      done();
    });
    it('should set if the ua is a bot.', function(done) {
      const params = {
        pid: '5aa03a87be66ee000110c13b',
        ua: 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
      };
      const event = Repo.createRequestEvent(params);
      expect(event.bot.detected).to.be.true;
      expect(event.bot.value).to.equal('googlebot');
      done();
    });
  });

  describe('#selectCampaigns', function() {
    it('should return an empty array when no campains are found.', function(done) {
      expect(Repo.selectCampaigns([], 1)).to.be.an('array').with.property('length', 0);
      done();
    });
    it('should return an empty array when no campains are found with a limit greater than 1', function(done) {
      expect(Repo.selectCampaigns([], 10)).to.be.an('array').with.property('length', 0);
      done();
    });
    it('should return an array with one item.', function(done) {
      const campaigns = ['1', '2', '3', '4'];
      const r = Repo.selectCampaigns(campaigns, 1);
      expect(r).to.be.an('array').with.property('length', 1);
      expect(campaigns.includes(r[0]));
      done();
    });
    it('should return an array with two items.', function(done) {
      const campaigns = ['1', '2', '3', '4'];
      const r = Repo.selectCampaigns(campaigns, 2);
      expect(r).to.be.an('array').with.property('length', 2);
      expect(campaigns.includes(r[0]));
      expect(campaigns.includes(r[1]));
      done();
    });
    it('should return an array with one item when the limit is 2', function(done) {
      const campaigns = ['1'];
      const r = Repo.selectCampaigns(campaigns, 2);
      expect(r).to.be.an('array').with.property('length', 1);
      expect(campaigns.includes(r[0]));
      done();
    });
  });

  describe('#queryCampaigns', function() {
    let placement1;
    let placement2;
    before(async function() {
      await AdvertiserRepo.remove();
      await CampaignRepo.remove();
      await PlacementRepo.remove();
      await TemplateRepo.remove();

      const advertiser = await createAdvertiser();

      placement1 = await createPlacement();
      placement2 = await createPlacement();
      const now = new Date();
      const futureEnd = moment().add(1, 'year').toDate();

      const propSet = [
        { status: 'Active', criteria: { placementIds: [placement1.id], start: now, end: futureEnd } },
        { status: 'Active', criteria: { placementIds: [placement2.id], start: now } },
        { status: 'Active', criteria: { placementIds: [placement1.id], start: now, kvs: [ { key: 'sect_id', value: '1234' } ] } },
        { status: 'Draft', criteria: { placementIds: [placement1.id], start: now, kvs: [ { key: 'sect_id', value: '1234' } ] } },
        { status: 'Active', criteria: { placementIds: [placement1.id], start: now, kvs: [ { key: 'sect_id', value: '1234' } ] } },
        { status: 'Active', criteria: { placementIds: [placement2.id], start: now, kvs: [ { key: 'sect_id', value: '1234' } ] } },
        { status: 'Active', criteria: { placementIds: [placement1.id], start: now, kvs: [ { key: 'sect_id', value: '1234' }, { key: 'x', value: '1' } ] } },
      ];
      const promises = Promise.all(propSet.map((props) => {
        const campaign = CampaignRepo.generate(1, {
          advertiserId: () => advertiser.id,
          placementId: () => props.criteria.placementIds[0],
        }).one();
        campaign.set(props);
        return campaign.save();
      }));
      await promises;

    });
    after(async function() {
      await AdvertiserRepo.remove();
      await CampaignRepo.remove();
      await PlacementRepo.remove();
      await TemplateRepo.remove();
    });
    beforeEach(function () {
      sandbox.spy(Utils, 'cleanValues');
      sandbox.spy(Repo, 'selectCampaigns');
    });
    afterEach(function() {
      sinon.assert.calledOnce(Utils.cleanValues);
      sandbox.restore();
    });
    it('should return no campaigns when campaign start date greater than now.', async function() {
      const params = {
        startDate: moment().subtract(1, 'year').toDate(),
        placementId: placement1.id,
        limit: 1,
      };
      const promise = Repo.queryCampaigns(params);
      await expect(promise).to.eventually.be.an('array');
      const result = await promise;
      expect(result.length).to.equal(0);
      sinon.assert.calledOnce(Repo.selectCampaigns);
    });
    it('should return one campaign when using placement1 and just start date', async function() {
      const params = {
        startDate: new Date(),
        placementId: placement1.id,
        limit: 100,
      };
      const promise = Repo.queryCampaigns(params);
      await expect(promise).to.eventually.be.an('array');
      const result = await promise;
      expect(result.length).to.equal(1);
      sinon.assert.calledOnce(Repo.selectCampaigns);
    });
    it('should return zero campaigns when using placement1 and current date is outside end date', async function() {
      const params = {
        startDate: moment().add(2, 'year').toDate(),
        placementId: placement1.id,
        limit: 100,
      };
      const promise = Repo.queryCampaigns(params);
      await expect(promise).to.eventually.be.an('array');
      const result = await promise;
      expect(result.length).to.equal(0);
      sinon.assert.calledOnce(Repo.selectCampaigns);
    });
    it('should return one campaign when using placement2 and just start date', async function() {
      const params = {
        startDate: new Date(),
        placementId: placement2.id,
        limit: 100,
      };
      const promise = Repo.queryCampaigns(params);
      await expect(promise).to.eventually.be.an('array');
      const result = await promise;
      expect(result.length).to.equal(1);
      sinon.assert.calledOnce(Repo.selectCampaigns);
    });
    it('should return three campaigns when using placement1 with start date and sect_id kv', async function() {
      const params = {
        startDate: new Date(),
        placementId: placement1.id,
        keyValues: { sect_id: 1234 },
        limit: 100,
      };
      const promise = Repo.queryCampaigns(params);
      await expect(promise).to.eventually.be.an('array');
      const result = await promise;
      expect(result.length).to.equal(3);
      sinon.assert.calledOnce(Repo.selectCampaigns);
    });
    it('should return zero campaigns when using placement1 with start date and sect_id kv with invalid value', async function() {
      const params = {
        startDate: new Date(),
        placementId: placement1.id,
        keyValues: { sect_id: 12345 },
        limit: 100,
      };
      const promise = Repo.queryCampaigns(params);
      await expect(promise).to.eventually.be.an('array');
      const result = await promise;
      expect(result.length).to.equal(0);
      sinon.assert.calledOnce(Repo.selectCampaigns);
    });
  });

  describe('#createCampaignRedirect', function() {
    beforeEach(function() {
      sandbox.spy(jwt, 'sign');
    });
    afterEach(function() {
      sandbox.restore();
    });

    it('should return the redirect URL.', function(done) {
      const requestURL = 'http://foo.com';
      const event = {
        uuid: '92e998a7-e596-4747-a233-09108938c8d4',
        pid: '5aa03a87be66ee000110c13b',
        cid: '5aabc20d62a17f0001bbcba4',
      };
      const url = Repo.createCampaignRedirect(requestURL, event);
      expect(url).to.match(/^http:\/\/foo\.com\/redir\/.*$/);
      sinon.assert.calledOnce(jwt.sign);
      sinon.assert.calledWith(jwt.sign, event, sinon.match.any, { noTimestamp: true });
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
    beforeEach(function() {
      sandbox.spy(TemplateRepo, 'render');
      sandbox.spy(TemplateRepo, 'getFallbackFallback');
    });
    afterEach(function() {
      sandbox.restore();
    });

    ['', undefined, null, false].forEach((fallback) => {
      it(`should return an empty ad object when the template fallback is '${fallback}'`, function (done) {
        const template = { fallback };
        const requestURL = 'http://www.foo.com';
        const event = {
          uuid: '92e998a7-e596-4747-a233-09108938c8d4',
          pid: '5aa03a87be66ee000110c13b',
          cid: '5aabc20d62a17f0001bbcba4',
          kv: { foo: 'bar' },
        };

        const expected = {
          campaignId: event.cid,
          creativeId: null,
          fallback: true,
        };
        const result = Repo.buildFallbackFor({
          template,
          requestURL,
          event,
        });
        expect(result).to.be.an('object');
        ['campaignId, creativeId, fallback'].forEach(k => expect(result[k]).to.equal(expected[k]));
        expect(result.html.length).to.be.gt(0);
        sinon.assert.calledOnce(TemplateRepo.render);
        sinon.assert.calledOnce(TemplateRepo.getFallbackFallback);
        sinon.assert.calledWith(TemplateRepo.getFallbackFallback, true);
        sinon.assert.calledWith(TemplateRepo.render, TemplateRepo.getFallbackFallback(true), { kv: { foo: 'bar' }, uuid: event.uuid, pid: event.pid });
        done();
      });
    });

    it('should render the ad with the fallback template and vars.', function(done) {
      const template = { fallback: '<div>{{ var }}</div>' };
      const requestURL = 'http://www.foo.com';
      const event = {
        uuid: '92e998a7-e596-4747-a233-09108938c8d4',
        pid: '5aa03a87be66ee000110c13b',
        cid: '5aabc20d62a17f0001bbcba4',
      };

      const expected = {
        campaignId: event.cid,
        creativeId: null,
        fallback: true,
        html: '<div>Variable here!</div>',
      };
      const fallbackVars = { var: 'Variable here!' };
      const result = Repo.buildFallbackFor({
        template,
        fallbackVars,
        requestURL,
        event,
      });
      expect(result).to.be.an('object');
      ['campaignId, creativeId, fallback'].forEach(k => expect(result[k]).to.equal(expected[k]));
      done();
    });

    it('should render the ad with the fallback template and beacon.', function(done) {
      const template = { fallback: '<div>{{ foo }}</div>{{build-beacon}}' };
      const requestURL = 'http://www.foo.com';
      const event = {
        uuid: '92e998a7-e596-4747-a233-09108938c8d4',
        pid: '5aa03a87be66ee000110c13b',
        cid: '5aabc20d62a17f0001bbcba4',
        kv: { foo: 'bar' },
      };

      const expected = {
        campaignId: event.cid,
        creativeId: null,
        fallback: true,
      };
      const fallbackVars = { foo: 'Variable here!' };

      const result = Repo.buildFallbackFor({
        template,
        fallbackVars,
        requestURL,
        event,
      });

      const fields = JSON.stringify({ uuid: '92e998a7-e596-4747-a233-09108938c8d4', pid: '5aa03a87be66ee000110c13b', kv: { foo: 'bar' } });

      expect(result).to.be.an('object');
      ['campaignId, creativeId, fallback'].forEach(k => expect(result[k]).to.equal(expected[k]));
      expect(result.html).to.match(/^<div>Variable here!<\/div>/);
      expect(result.html).to.match(/<script>fortnight\('event', 'load', {"uuid":"92e998a7-e596-4747-a233-09108938c8d4","pid":"5aa03a87be66ee000110c13b","kv":{"foo":"bar"}}, { transport: 'beacon' }\);<\/script>/);
      done();
    });

    it('should render the ad with the fallback template and beacon, when no vars are sent.', function(done) {
      const template = { fallback: '<div>{{ foo }}</div>{{build-beacon}}' };
      const requestURL = 'http://www.foo.com';
      const event = {
        uuid: '92e998a7-e596-4747-a233-09108938c8d4',
        pid: '5aa03a87be66ee000110c13b',
        cid: '5aabc20d62a17f0001bbcba4',
        kv: { foo: 'bar' },
      };

      const expected = {
        campaignId: event.cid,
        creativeId: null,
        fallback: true,
      };
      const fallbackVars = undefined;

      const result = Repo.buildFallbackFor({
        template,
        fallbackVars,
        requestURL,
        event,
      });
      expect(result).to.be.an('object');
      ['campaignId, creativeId, fallback'].forEach(k => expect(result[k]).to.equal(expected[k]));
      expect(result.html).to.match(/^<div><\/div>/);
      expect(result.html).to.match(/<script>fortnight\('event', 'load', {"uuid":"92e998a7-e596-4747-a233-09108938c8d4","pid":"5aa03a87be66ee000110c13b","kv":{"foo":"bar"}}, { transport: 'beacon' }\);<\/script>/);
      done();
    });

  });

  describe('#createImgBeacon', function() {
    it('should return the tracker HMTL snippet.', function(done) {
      const expected = '<div data-fortnight-type="placement"><img data-fortnight-view="pending" data-fortnight-beacon="http://www.foo.com/e/abcd/view.gif" src="http://www.foo.com/e/abcd/load.gif"></div>';
      const result = Repo.createImgBeacon({ load: 'http://www.foo.com/e/abcd/load.gif', view: 'http://www.foo.com/e/abcd/view.gif' });
      expect(result).to.equal(expected);
      done();
    });
  });

  describe('#createTracker', function() {
    beforeEach(function() {
      sandbox.spy(jwt, 'sign');
    });
    afterEach(function() {
      sandbox.restore();
    });
    it('should create the URL.', function(done) {
      const type = 'view';
      const requestURL = 'http://www.foo.com';
      const event = {
        uuid: '92e998a7-e596-4747-a233-09108938c8d4',
        pid: '5aa03a87be66ee000110c13b',
        cid: '5aabc20d62a17f0001bbcba4',
      };

      const url = Repo.createTracker(type, requestURL, event);
      expect(url).to.match(/^http:\/\/www\.foo\.com\/e\/.*\/view\.gif$/);
      sinon.assert.calledOnce(jwt.sign);
      sinon.assert.calledWith(jwt.sign, event, sinon.match.any, { noTimestamp: true });
      done();
    });
  });

  describe('#getCreativeFor', function() {
    let campaign;
    before(async function() {
      campaign = await createCampaign();
      campaign.set('creatives', []);
    });
    after(async function() {
      await CampaignRepo.remove();
    });

    it('should return null when no creatives are found.', async function() {
      await expect(Repo.getCreativeFor(campaign)).to.eventually.be.null;
    });

    it('should always return a creative when only one creative is set.', async function() {
      campaign.set('creatives.0', {});
      const creative = await Repo.getCreativeFor(campaign);
      expect(creative).to.be.an('object');
      expect(creative.get('id')).to.equal(campaign.get('creatives.0.id'));
    });

    it('should randomize the creatives.', async function() {
      campaign.creatives.push({});
      campaign.creatives.push({});
      campaign.creatives.push({});
      campaign.creatives.push({});
      const ids = campaign.creatives.map(creative => creative.id);

      const found = [];
      for (let i = 0; i < 5; i += 1) {
        let creative = await Repo.getCreativeFor(campaign);
        expect(ids.includes(creative.id)).to.be.true;
        if (!found.includes(creative.id)) {
          found.push(creative.id);
        }
      }
      expect(found.length).to.be.gt(1);
    });

  })

  describe('#buildAdFor', function() {
    let campaign;
    beforeEach(function() {
      sandbox.spy(Repo, 'buildFallbackFor');
      sandbox.spy(Repo, 'createTrackers');
      sandbox.spy(Repo, 'createCampaignRedirect');
      sandbox.spy(Repo, 'createImgBeacon');
      sandbox.spy(Repo, 'getCreativeFor');
      sandbox.spy(TemplateRepo, 'render');
    });
    afterEach(function() {
      sandbox.restore();
    });
    before(async function() {
      campaign = await createCampaign();
      campaign.set('creatives', []);
    });
    after(async function() {
      await CampaignRepo.remove();
    });

    it('should build a fallback when the creatives are empty.', async function() {
      const params = {
        campaign,
        template: { fallback: null },
        fallbackVars: {},
        requestURL: 'http://www.foo.com',
        event: {
          cid: campaign.id,
          pid: '5aa03a87be66ee000110c13b',
          uuid: '92e998a7-e596-4747-a233-09108938c8d4',
        },
      };

      const result = await Repo.buildAdFor(params);
      sinon.assert.calledOnce(Repo.getCreativeFor);
      sinon.assert.calledWith(Repo.getCreativeFor, campaign);
      sinon.assert.calledOnce(Repo.buildFallbackFor);
      sinon.assert.calledOnce(TemplateRepo.render);
    });

    ['', null, undefined].forEach((value) => {
      it(`should build a fallback when the campaign id value is '${value}'`, async function() {
        const params = {
          campaign: { id: value },
          template: { fallback: null },
          fallbackVars: {},
          requestURL: 'http://www.foo.com',
          event: {
            cid: campaign.id,
            pid: '5aa03a87be66ee000110c13b',
            uuid: '92e998a7-e596-4747-a233-09108938c8d4',
          },
        };

        const result = await Repo.buildAdFor(params);
        sinon.assert.calledOnce(Repo.buildFallbackFor);
        sinon.assert.calledOnce(TemplateRepo.render);
      });
    });

    it('should build the rendered ad object.', async function() {
      campaign.set('creatives.0', {});
      const creative = campaign.get('creatives.0');
      const params = {
        campaign,
        template: { html: '<div>{{ campaign.id }}</div><span>{{ creative.id }}</span>' },
        fallbackVars: {},
        requestURL: 'http://www.foo.com',
        event: {
          cid: campaign.id,
          pid: '5aa03a87be66ee000110c13b',
          uuid: '92e998a7-e596-4747-a233-09108938c8d4',
        },
      };

      const expected = {
        campaignId: campaign.id,
        creativeId: creative.id,
        fallback: false,
        html: `<div>${campaign.id}</div><span>${creative.id}</span>`,
      };
      await expect(Repo.buildAdFor(params)).to.eventually.deep.equal(expected);
      sinon.assert.calledOnce(Repo.getCreativeFor);
      sinon.assert.calledWith(Repo.getCreativeFor, campaign);
      sinon.assert.calledOnce(TemplateRepo.render);
      sinon.assert.notCalled(Repo.buildFallbackFor);
    });

  });

  describe('#findFor', function() {
    const requestURL = 'https://somedomain.com';

    beforeEach(function() {
      sandbox.spy(Repo, 'getPlacementAndTemplate');
      sandbox.spy(Repo, 'queryCampaigns');
      sandbox.spy(Repo, 'fillWithFallbacks');
      sandbox.spy(Repo, 'createRequestEvent');
      sandbox.spy(Repo, 'buildAdFor');
    });
    afterEach(function() {
      sandbox.restore();
    });

    let placement;
    let template;
    before(async function() {
      placement = await createPlacement();
      template = await createTemplate();
      await AnalyticsEvent.remove();
    });
    after(async function() {
      await AnalyticsEvent.remove();
    });

    it('should reject when no request URL is provided.', async function() {
      const placementId = placement.id;
      const templateId = template.id;
      await expect(Repo.findFor({ placementId, templateId, requestURL: '' })).to.be.rejectedWith(Error, 'No request URL was provided');
    });

    it('should throw a not implemented error if greater than 1', async function() {
      const placementId = placement.id;
      const templateId = template.id;
      const num = 2;
      await expect(Repo.findFor({ placementId, templateId, requestURL, num })).to.be.rejectedWith(Error, 'Requesting more than one ad in a request is not yet implemented');
    });

    it('should reject when the num is higher than 10.', async function() {
      const placementId = placement.id;
      const templateId = template.id;
      const num = 11;
      await expect(Repo.findFor({ placementId, templateId, num, requestURL })).to.be.rejectedWith(Error, 'You cannot return more than 10 ads in one request.');
    });

    it('should reject when no params are sent', async function() {
      await expect(Repo.findFor()).to.be.rejectedWith(Error);
    });

    [undefined, 0, -1, 1, null, '1'].forEach((num) => {
      it(`should fulfill with a single campaign when num is ${num}`, async function() {
        const placementId = placement.id;
        const templateId = template.id;

        await expect(Repo.findFor({ placementId, templateId, num, requestURL })).to.be.fulfilled.and.eventually.be.an('array').with.property('length', 1);
        sinon.assert.calledOnce(Repo.getPlacementAndTemplate);
        sinon.assert.calledOnce(Repo.queryCampaigns);
        sinon.assert.calledOnce(Repo.fillWithFallbacks);
        sinon.assert.calledOnce(Repo.createRequestEvent);
        sinon.assert.calledOnce(Repo.buildAdFor);
      });
    });

    // Remove once requests are no longer saved.

    // it('should should record the proper request event.', async function() {
    //   await AnalyticsEvent.remove();
    //   const placementId = placement.id;
    //   const templateId = template.id;
    //   const num = 1;

    //   const promise = Repo.findFor({ placementId, templateId, requestURL, num });
    //   await expect(promise).to.be.fulfilled;
    //   const ads = await promise;
    //   const result = await AnalyticsEvent.findOne({ pid: placementId });
    //   expect(result).to.be.an('object');

    //   sinon.assert.calledOnce(Repo.getPlacementAndTemplate);
    //   sinon.assert.calledOnce(Repo.queryCampaigns);
    //   sinon.assert.calledOnce(Repo.fillWithFallbacks);
    //   sinon.assert.calledOnce(Repo.createRequestEvent);
    //   sinon.assert.calledOnce(Repo.buildAdFor);
    // });
  });

});
