const AWS = require('aws-sdk');
const Repo = require('../../src/repositories/image');
const sandbox = sinon.createSandbox();

describe('repositories/image', function() {
  it('should export an object.', function(done) {
    expect(Repo).to.be.an('object');
    done();
  });
  describe('#signUpload', function() {
    before(function() {
      sandbox.stub(AWS.S3.prototype, 'getSignedUrl')
        .onCall(1).callsArgWith(2, new Error('Unable to sign.'))
        .callsArgWith(2, null, 'https://domain.com')
      ;
    });

    after(function() {
      sinon.assert.alwaysCalledWith(AWS.S3.prototype.getSignedUrl, 'putObject');
      sandbox.restore();
    });

    ['', null, undefined, false, 0].forEach((value) => {
      it(`should reject when the filename value is '${value}'.`, async function() {
        await expect(Repo.signUpload(value)).to.be.rejectedWith(Error, 'Unable to sign upload: no filename provided.');
      });
    });

    ['image/tiff', 'image/gif', 'text/html'].forEach((value) => {
      it(`should reject when the file type value is '${value}'.`, async function() {
        await expect(Repo.signUpload(value)).to.be.rejectedWith(Error, 'Unable to sign upload: invalid file type.');
      });
    });

    it('should fulfill.', async function() {
      await expect(Repo.signUpload('foo.png', 'image/png')).to.be.fulfilled.and.eventually.be.an('object').with.all.keys('url', 'key', 'expires');
      sinon.assert.calledOnce(AWS.S3.prototype.getSignedUrl);
    });

    it('should reject.', async function() {
      await expect(Repo.signUpload('foo.png', 'image/png')).to.be.rejectedWith(Error, 'Unable to sign.')
      sinon.assert.calledTwice(AWS.S3.prototype.getSignedUrl);
    });

    ['image/jpeg', 'image/png', 'image/webm'].forEach((value) => {
      it(`should fullfil when the file type value is '${value}'.`, async function() {
        await expect(Repo.signUpload('foo.png', 'image/png')).to.be.fulfilled.and.eventually.be.an('object').with.all.keys('url', 'key', 'expires');
      });
    });
  });
});
