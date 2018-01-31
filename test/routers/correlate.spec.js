const expect = require('chai').expect;
const request = require('supertest');
const app = require('../../src/app');

const emptyGif = Buffer.from('R0lGODlhAQABAPAAAAAAAAAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==', 'base64');

const testImageResponse = (res) => {
  expect(res.get('content-type'), 'image/gif');
  expect(res.body.toString()).to.equal(emptyGif.toString());
};

describe('routers/correlate', function() {
  it('should respond to the view event.', function(done) {
    request(app)
      .get('/c/v/eb820a26-a7c7-4a1c-bc0f-c6975658f03f.gif')
      .expect(200)
      .expect(testImageResponse)
      .end(done);
  });
  it('should respond to the load event.', function(done) {
    request(app)
      .get('/c/l/eb820a26-a7c7-4a1c-bc0f-c6975658f03f.gif')
      .expect(200)
      .expect(testImageResponse)
      .end(done);
  });
  it('should return a bad request when the event is not supported.', function(done) {
    request(app)
      .get('/c/foo/eb820a26-a7c7-4a1c-bc0f-c6975658f03f.gif')
      .expect(400)
      .expect(testImageResponse)
      .end(done);
  });
  it('should return a bad request when the UUID is invalid.', function(done) {
    request(app)
      .get('/c/v/1234.gif')
      .expect(400)
      .expect(testImageResponse)
      .end(done);
  });
  it('should return a not found if the image extension is missing.', function(done) {
    request(app)
      .get('/c/v/eb820a26-a7c7-4a1c-bc0f-c6975658f03f')
      .expect(404)
      .end(done);
  });
});
