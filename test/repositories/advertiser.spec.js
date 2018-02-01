const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const sinon = require('sinon');
const Repo = require('../../src/repositories/advertiser');
const Model = require('../../src/models/advertiser');
const Promise = require('bluebird');

chai.use(chaiAsPromised);
const expect = chai.expect;

describe('repositories/advertiser', function() {
  it('should export an object.', function(done) {
    expect(Repo).to.be.an('object');
    done();
  });
  describe('#findById', function() {
    it('should return an advertiser document.', async () => {
      const findOne = sinon.stub(Model, 'findOne');
      findOne.callsFake(({ _id }) => Promise.resolve({ _id }));
      await expect(Repo.findById('1234'))
        .to.be.fulfilled
        .and.eventually.have.property('_id').equal('1234')
      ;
      findOne.restore();
    });
    it('should error when the advertiser is not found.', async () => {
      const findOne = sinon.stub(Model, 'findOne');
      findOne.callsFake(({ _id }) => Promise.resolve(null));

      const id = '1234';
      await expect(Repo.findById(id))
        .to.be.rejectedWith(Error, `No advertiser found for id '${id}'`)
      ;
      findOne.restore();
    });
  });
});
