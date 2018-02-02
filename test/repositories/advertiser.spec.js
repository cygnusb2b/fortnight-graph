const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const sinon = require('sinon');
const Repo = require('../../src/repositories/advertiser');
const Model = require('../../src/models/advertiser');
const Pagination = require('../../src/classes/pagination');
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
  describe('#update', function() {
    beforeEach(function() {
      sandbox.stub(Model, 'findOneAndUpdate').callsFake(({ _id }, { $set }, options) => {
        const val = _id === '1234' ? { _id, name: $set.name } : null;
        return Promise.resolve(val);
      });

    });
    afterEach(function() {
      sinon.assert.calledOnce(Model.findOneAndUpdate);
      sandbox.restore();
    });

    it('should return the updated advertiser document.', async () => {
      const id = '1234';
      const name = 'New Name';
      await expect(Repo.update({ id, name }))
        .to.be.fulfilled
        .and.become({ _id: id, name });
      ;
      sinon.assert.calledWith(Model.findOneAndUpdate, { _id: id }, { $set: { name } }, { new: true });
    });
    it('should error when the advertiser is not found.', async () => {
      const id = '12345';
      const name = 'New Name';
      await expect(Repo.update({ id, name }))
        .to.be.rejectedWith(Error, `No advertiser found for id '${id}'`)
      ;
      sinon.assert.calledWith(Model.findOneAndUpdate, { _id: id }, { $set: { name } }, { new: true });
    });
  });
  describe('#create', function() {
    beforeEach(function() {
      sandbox.stub(Model.prototype, 'save').callsFake(() => {
        return Promise.resolve({ id: '1234' });
      });

    });
    afterEach(function() {
      sinon.assert.calledOnce(Model.prototype.save);
      sandbox.restore();
    });

    it('should return the created advertiser document.', async () => {
      const name = 'New Name';
      await expect(Repo.create({ name }))
        .to.be.fulfilled
        .and.become({ id: '1234' });
      ;
    });
    it('should return the created advertiser document when no payload is present.', async () => {
      await expect(Repo.create())
        .to.be.fulfilled
        .and.become({ id: '1234' });
      ;
    });
  });
  describe('#paginate', function() {
    it('should return a Pagination instance.', function(done) {
      const paginated = Repo.paginate();
      expect(paginated).to.be.an.instanceOf(Pagination);
      expect(paginated.Model).to.be.a('function');
      done();
    })
  });
});
