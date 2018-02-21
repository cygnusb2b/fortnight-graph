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
  });

});
