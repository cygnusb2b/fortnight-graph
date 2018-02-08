const { expect } = require('chai');

const runAuthExpect = (res) => {
  const { body, status } = res;
  expect(status).to.equal(200);

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

    expect(body).to.have.property('errors').and.be.an('array');
    const messages = body.errors.map(err => err.message);
    expect(messages).to.contain(message);
  },

  expectGraphSuccess(res, root, type = 'object') {
    const { body, status } = res;
    expect(status).to.equal(200);
    expect(body).to.have.property('data').and.be.an('object');
    expect(body).to.not.have.property('errors');
    const { data } = body;
    expect(data).to.have.property(root).and.be.a(type);
  },

  parseGraphResponse(res, root) {
    const { body } = res;
    const { data } = body;
    return data[root];
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
