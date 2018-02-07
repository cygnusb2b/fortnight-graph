const { expect } = require('chai');

const runAuthExpect = (res) => {
  const { body, status } = res;
  expect(status).to.equal(200);

  expect(body).to.have.property('data').and.be.null;
  expect(body).to.have.property('errors').and.be.an('array');

  const error = body.errors.find(err => err.message === 'You must be logged-in to access this resource.');
  expect(error).to.be.an('object');
};



const GRAPH_ENDPOINT = '/graph';

module.exports = {
  GRAPH_ENDPOINT,
  /**
   *
   */
  buildGraphQuery(query, variables) {
    const body = {
      query,
    };
    if (variables) body.variables = variables;
    return body;
  },

  expectGraphError(res, message) {
    const { body, status } = res;
    expect(status).to.equal(200);

    expect(body).to.have.property('data').and.be.null;
    expect(body).to.have.property('errors').and.be.an('array');
    // @todo Make this a better error message.
    const error = body.errors.find(err => err.message === message);
    expect(error).to.be.an('object');
  },

  /**
   *
   */
  testNoAuth(request, app, body, done) {
    request(app)
      .post(GRAPH_ENDPOINT).send(body).expect(200)
      .expect(runAuthExpect)
      .end(done);
    ;
  },

  /**
   *
   */
  testBadAuth(request, app, body, done) {
    request(app)
      .post(GRAPH_ENDPOINT)
      .set('Authorization', 'Bearer someinvalidtoken')
      .send(body).expect(200)
      .expect(runAuthExpect)
      .end(done);
    ;
  },
};
