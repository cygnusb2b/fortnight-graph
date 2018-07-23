require('../connections');
const Template = require('../../src/models/template');
const fixtures = require('../../src/fixtures');
const { testTrimmedField, testUniqueField, testRequiredField } = require('../utils');

const generateTemplate = () => {
  return fixtures(Template).one();
};

describe('schema/template', function() {
  before(async function() {
    await Template.remove();
  });
  after(async function() {
    await Template.remove();
  });

  it('should successfully save.', async function() {
    const template = generateTemplate();
    await expect(template.save()).to.be.fulfilled;
  });

  describe('#name', function() {
    let template;
    beforeEach(function() {
      template = generateTemplate();
    });
    it('should be trimmed.', function() {
      return testTrimmedField(Template, template, 'name');
    });
    ['', null, undefined].forEach((value) => {
      it(`should be required and be rejected when the value is '${value}'`, function() {
        return testRequiredField(Template, template, 'name', value);
      });
    });

  });

  describe('#html', function() {
    let template;
    beforeEach(function() {
      template = generateTemplate();
    });
    [null, undefined, ''].forEach((value) => {
      it(`should be required and be rejected when the value is '${value}'`, function() {
        return testRequiredField(Template, template, 'html', value);
      });
    });
    it('should be rejected when the {{build-beacon}} helper is missing.', async function() {
      template.html = '<div {{build-container-attributes}}>{{#tracked-link href=href}}{{/tracked-link}}</div>';
      await expect(template.save()).to.be.rejectedWith(Error, 'The {{build-beacon}} helper must be present, exactly one time.');
    });
    it('should be rejected when more than one {{build-beacon}} helpers are present.', async function() {
      template.html = '<div {{build-container-attributes}}>{{#tracked-link href=href}}{{/tracked-link}}{{build-beacon}}{{build-beacon}}</div>';
      await expect(template.save()).to.be.rejectedWith(Error, 'The {{build-beacon}} helper must be present, exactly one time.');
    });
    it('should be rejected when the {{build-container-attributes}} helper is missing.', async function() {
      template.html = '<div>{{#tracked-link href=href}}{{/tracked-link}}{{build-beacon}}</div>';
      await expect(template.save()).to.be.rejectedWith(Error, 'The {{build-container-attributes}} helper must be present, exactly one time.');
    });
    it('should be rejected when more than one {{build-container-attributes}} helpers are present.', async function() {
      template.html = '<div {{build-container-attributes}}>{{#tracked-link href=href}}{{/tracked-link}}{{build-beacon}}<span {{build-container-attributes}}></span></div>';
      await expect(template.save()).to.be.rejectedWith(Error, 'The {{build-container-attributes}} helper must be present, exactly one time.');
    });
    it('should be rejected when the {{#tracked-link href=href}} helper is missing.', async function() {
      template.html = '<div {{build-container-attributes}}>{{build-beacon}}</div>';
      await expect(template.save()).to.be.rejectedWith(Error, 'The {{#tracked-link href=href}}{{/tracked-link}} helper must be present.');
    });
    it('should be rejected when more than one {{build-ua-beacon}} helpers are present.', async function() {
      template.html = '<div {{build-container-attributes}}>{{#tracked-link href=href}}{{/tracked-link}}{{build-beacon}}<span>{{build-ua-beacon}}{{build-ua-beacon}}</span></div>';
      await expect(template.save()).to.be.rejectedWith(Error, 'The {{build-ua-beacon}} helper is optional, but can only be used once.');
    });
  });

  describe('#fallback', function() {
    let template;
    beforeEach(function() {
      template = generateTemplate();
    });
    [null, undefined, ''].forEach((value) => {
      it(`should succssfully save when the value is '${value}'`, async function() {
        template.fallback = value;
        await expect(template.save()).to.be.fulfilled;
      });
    });
    it('should be rejected when the {{build-beacon}} helper is missing.', async function() {
      template.fallback = '<div {{build-container-attributes}}>{{#tracked-link href=url}}{{/tracked-link}}</div>';
      await expect(template.save()).to.be.rejectedWith(Error, 'The {{build-beacon}} helper must be present, exactly one time.');
    });
    it('should be rejected when more than one {{build-beacon}} helpers are present.', async function() {
      template.fallback = '<div {{build-container-attributes}}>{{#tracked-link href=url}}{{/tracked-link}}{{build-beacon}}{{build-beacon}}</div>';
      await expect(template.save()).to.be.rejectedWith(Error, 'The {{build-beacon}} helper must be present, exactly one time.');
    });
    it('should be rejected when the {{build-container-attributes}} helper is missing.', async function() {
      template.fallback = '<div>{{#tracked-link href=url}}{{/tracked-link}}{{build-beacon}}</div>';
      await expect(template.save()).to.be.rejectedWith(Error, 'The {{build-container-attributes}} helper must be present, exactly one time.');
    });
    it('should be rejected when more than one {{build-container-attributes}} helpers are present.', async function() {
      template.fallback = '<div {{build-container-attributes}}>{{#tracked-link href=url}}{{/tracked-link}}{{build-beacon}}<span {{build-container-attributes}}></span></div>';
      await expect(template.save()).to.be.rejectedWith(Error, 'The {{build-container-attributes}} helper must be present, exactly one time.');
    });
    it('should be rejected when the {{#tracked-link href=url}} helper is missing.', async function() {
      template.fallback = '<div {{build-container-attributes}}>{{build-beacon}}</div>';
      await expect(template.save()).to.be.rejectedWith(Error, 'The {{#tracked-link href=url}}{{/tracked-link}} helper must be present.');
    });
    it('should be rejected when more than one {{build-ua-beacon}} helpers are present.', async function() {
      template.fallback = '<div {{build-container-attributes}}>{{#tracked-link href=url}}{{/tracked-link}}{{build-beacon}}<span>{{build-ua-beacon}}{{build-ua-beacon}}</span></div>';
      await expect(template.save()).to.be.rejectedWith(Error, 'The {{build-ua-beacon}} helper is optional, but can only be used once.');
    });
  });

});
