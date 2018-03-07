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
    it('should be unique.', function() {
      const another = generateTemplate();
      return testUniqueField(Template, template, another, 'name');
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
    it('should be rejected when the {{ beacon }} var is missing.', async function() {
      template.html = '<div>{{ href }}</div>';
      await expect(template.save()).to.be.rejectedWith(Error, 'The {{ beacon }} merge variable must be present, exactly one time.');
    });
    it('should be rejected when more than one {{ beacon }} var is present.', async function() {
      template.html = '<div>{{ href }}{{beacon}} {{  beacon   }}</div>';
      await expect(template.save()).to.be.rejectedWith(Error, 'The {{ beacon }} merge variable must be present, exactly one time.');
    });
    it('should be rejected when the {{ href }} var is missing.', async function() {
      template.html = '<div>{{ beacon }}</div>';
      await expect(template.save()).to.be.rejectedWith(Error, 'The {{ href }} merge variable must be present.');
    });
  });

  describe('#fallback', function() {
    let template;
    beforeEach(function() {
      template = generateTemplate();
    });
    [null, undefined, ''].forEach((value) => {
      it(`should succssfully save when the value is '${value}'`, async function() {
        await expect(template.save()).to.be.fulfilled;
      });
    });
    it('should be rejected when the {{ beacon }} var is missing.', async function() {
      template.fallback = '<div></div>';
      await expect(template.save()).to.be.rejectedWith(Error, 'The {{ beacon }} merge variable must be present, exactly one time.');
    });
    it('should be rejected when more than one {{ beacon }} var is present.', async function() {
      template.fallback = '<div>{{beacon}} {{  beacon   }}</div>';
      await expect(template.save()).to.be.rejectedWith(Error, 'The {{ beacon }} merge variable must be present, exactly one time.');
    });
    it('should be rejected when the {{ url }} var is missing.', async function() {
      template.fallback = '<div>{{ beacon }}</div>';
      await expect(template.save()).to.be.rejectedWith(Error, 'The {{ url }} merge variable must be present.');
    });
  });

});
