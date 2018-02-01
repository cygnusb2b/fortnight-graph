const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const sinon = require('sinon');
const Repo = require('../../src/repositories/advertiser');
const Model = require('../../src/models/advertiser');
const Promise = require('bluebird');

chai.use(chaiAsPromised);
const expect = chai.expect;
const sandbox = sinon.createSandbox();

describe('repositories/advertiser', function() {
  it('should export an object.', function(done) {
    expect(Repo).to.be.an('object');
    done();
  });
  describe('#findById', function() {
    beforeEach(function() {
      sandbox.stub(Model, 'findOne').callsFake(({ _id }) => {
        const val = _id === '1234' ? { _id } : null;
        return Promise.resolve(val);
      });

    });
    afterEach(function() {
      sinon.assert.calledOnce(Model.findOne);
      sandbox.restore();
    });

    it('should return an advertiser document.', async () => {
      const _id = '1234';
      await expect(Repo.findById('1234'))
        .to.be.fulfilled
        .and.eventually.have.property('_id').equal(_id)
      ;
      sinon.assert.calledWith(Model.findOne, { _id });
    });
    it('should error when the advertiser is not found.', async () => {
      const id = '12345';
      await expect(Repo.findById(id))
        .to.be.rejectedWith(Error, `No advertiser found for id '${id}'`)
      ;
      sinon.assert.calledWith(Model.findOne, { _id: id });
    });
  });
});
