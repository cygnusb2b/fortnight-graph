const expect = require('chai').expect;
const Generate = require('../../../src/fixtures/generators/creative');

describe('fixtures/generators/publisher', function() {
  it('should return a factory function', function(done) {
    expect(Generate).to.be.a('function');
    done();
  });
  it('should return a generated object.', function(done) {
    const obj = Generate();
    expect(obj).to.be.an('object');
    expect(obj).to.have.keys(['name', 'url', 'title', 'teaser', 'image']);
    expect(obj).to.have.property('name').and.be.a('string');
    expect(obj).to.have.property('url').and.be.a('string');
    expect(obj).to.have.property('title').and.be.a('string');
    expect(obj).to.have.property('teaser').and.be.a('string');
    expect(obj).to.have.property('image').and.be.a('string');
    done();
  });
});
