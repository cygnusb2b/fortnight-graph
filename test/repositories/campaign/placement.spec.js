require('../../connections');
const Repo = require('../../../src/repositories/campaign/placement');
const AnalyticsRequest = require('../../../src/models/analytics/request');
const AnalyticsRequestObject = require('../../../src/models/analytics/request-object');
const CampaignRepo = require('../../../src/repositories/campaign');
const PlacementRepo = require('../../../src/repositories/placement');
const TemplateRepo = require('../../../src/repositories/template');

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
        const template = { fallback };
        const expected = {
          campaignId,
          creativeId: null,
          fallback: true,
          html: '',
        };
        expect(Repo.buildFallbackFor(campaignId, template)).to.deep.equal(expected);
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
      expect(Repo.buildFallbackFor(campaignId, template, fallbackVars)).to.deep.equal(expected);
      done();
    });

  });

  describe('#buildAdFor', function() {
    let campaign;
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
        html: '',
      };
      expect(Repo.buildAdFor(campaign, template)).to.deep.equal(expected);
      done();
    });

    ['', null, undefined].forEach((value) => {
      it(`should build a fallback when no campaign id value is '${value}'`, function(done) {
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
      done();
    });

  });

  describe('#findFor', function() {
    const requestURL = 'https://somedomain.com';

    let placement;
    let template;
    before(async function() {
      placement = await createPlacement();
      template = await createTemplate();
      await AnalyticsRequestObject.remove();
      await AnalyticsRequest.remove();
    });
    it('should should record the proper request analytics.', async function() {
      const placementId = placement.id;
      const templateId = template.id;
      const num = 3;
      await expect(Repo.findFor({ placementId, templateId, requestURL, num })).to.be.fulfilled;
      const obj = await AnalyticsRequestObject.findOne({ pid: placementId });
      expect(obj).to.be.an('object');
      const request = await AnalyticsRequest.findOne({ hash: obj.hash });
      expect(request.n).to.equal(3);
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
    it('should fulfill when no campaigns are found, but still have the correct length.', async function() {
      await CampaignRepo.remove();
      const placementId = placement.id;
      const templateId = template.id;
      const num = 3;
      await expect(Repo.findFor({ placementId, templateId, requestURL, num })).to.be.fulfilled.and.eventually.be.an('array').with.property('length', 3);
    });
    it('should fulfill when a campaign is found.', async function() {
      await CampaignRepo.remove();
      const placementId = placement.id;
      const templateId = template.id;
      const num = 1;
      const campaign = await createCampaign();
      await expect(Repo.findFor({ placementId, templateId, num, requestURL })).to.be.fulfilled.and.eventually.be.an('array').with.property('length', 1);
      await CampaignRepo.remove();
    });
    it('should fulfill when a campaign is found, and fallbacks are present.', async function() {
      await CampaignRepo.remove();
      const placementId = placement.id;
      const templateId = template.id;
      const num = 3;
      const campaign = await createCampaign();
      await expect(Repo.findFor({ placementId, templateId, num, requestURL })).to.be.fulfilled.and.eventually.be.an('array').with.property('length', 3);
      await CampaignRepo.remove();
    });
    [undefined, 0, -1, 1, null, '1'].forEach((num) => {
      it(`should fulfill with a single campaign when num is ${num}`, async function() {
        const placementId = placement.id;
        const templateId = template.id;
        await createCampaign();
        await createCampaign();
        await expect(Repo.findFor({ placementId, templateId, num, requestURL })).to.be.fulfilled.and.eventually.be.an('array').with.property('length', 1);
        await CampaignRepo.remove();
      });
    });

  });

});
