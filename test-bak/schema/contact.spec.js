require('../connections');
const Contact = require('../../src/models/contact');
const fixtures = require('../../src/fixtures');
const { testTrimmedField, testUniqueField, testRequiredField, stubHash } = require('../utils');

const generateContact = () => fixtures(Contact, 1).one();

describe('schema/contact', function() {
  let stub;
  before(function() {
    stub = stubHash();
    return Contact.remove();
  });
  after(function() {
    stub.restore();
    return Contact.remove();
  });
  it('should successfully save.', async function() {
    const contact = generateContact();
    await expect(contact.save()).to.be.fulfilled;
  });

  describe('#email', function() {
    let contact;
    beforeEach(function() {
      contact = generateContact();
    });
    it('should be trimmed.', function() {
      return testTrimmedField(Contact, contact, 'email', { value: ' foo@bar.com  ', expected: 'foo@bar.com' });
    });
    const values = ['', null, undefined];
    values.forEach((value) => {
      it(`should be required and be rejected when the value is '${value}'`, function() {
        return testRequiredField(Contact, contact, 'email', value);
      });
    });
    it('should be unique.', function() {
      const another = generateContact();
      return testUniqueField(Contact, contact, another, 'email', 'some@email.com');
    });
    it('should be lowercased', async function() {
      contact.set('email', 'Foo@Bar.net');
      await expect(contact.save()).to.be.fulfilled;
      await expect(Contact.findOne({ _id: contact.id })).to.eventually.have.property('email').equal('foo@bar.net');
    });

    ['some val', 'some@val', 'some@@email.net', '@yahoo.com'].forEach((value) => {
      it(`should be a valid email address and be rejected when the value is '${value}'`, async function() {
        contact.set('email', value);
        await expect(contact.save()).to.be.rejectedWith(Error, /invalid email address/i);
      });
    });
  });

  describe('#givenName', function() {
    let contact;
    beforeEach(function() {
      contact = generateContact();
    });
    it('should be trimmed.', function() {
      return testTrimmedField(Contact, contact, 'givenName');
    })
  });

  describe('#familyName', function() {
    let contact;
    beforeEach(function() {
      contact = generateContact();
    });
    it('should be trimmed.', function() {
      return testTrimmedField(Contact, contact, 'familyName');
    });
  });

  describe('#name', function() {
    let contact;
    beforeEach(function() {
      contact = generateContact();
    });
    it('should be trimmed.', function() {
      const value = `   ${contact.givenName} ${contact.familyName}   `;
      const expected = `${contact.givenName} ${contact.familyName}`;
      return testTrimmedField(Contact, contact, 'name', { value, expected });
    });
  });

});
