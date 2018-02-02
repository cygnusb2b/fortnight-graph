const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const sinon = require('sinon');
const Repo = require('../../src/repositories/campaign');
const Model = require('../../src/models/campaign');
const Pagination = require('../../src/classes/pagination');
const Promise = require('bluebird');

chai.use(chaiAsPromised);
const expect = chai.expect;
const sandbox = sinon.createSandbox();

describe('repositories/campaign', function() {
  it('should export an object.', function(done) {
    expect(Repo).to.be.an('object');
    done();
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

    it('should return the created campaign document.', async () => {
      const name = 'New Name';
      await expect(Repo.create({ name }))
        .to.be.fulfilled
        .and.become({ id: '1234' });
      ;
    });
    it('should return the created campaign document when no payload is present.', async () => {
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
