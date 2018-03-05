const bcrypt = require('bcrypt');
const { expect } = require('chai');
const Pagination = require('../src/classes/pagination');
const Promise = require('bluebird');

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
    expect(messages).to.contain(message, `Errors found: ${messages.join('; ')}`);
  },

  expectGraphSuccess(res, root, type = 'object') {
    const { body, status } = res;
    expect(status).to.equal(200);
    expect(body).to.be.an('object');

    expect(body).to.not.have.property('errors');

    expect(body).to.have.property('data');
    const { data } = body;
    expect(data).to.be.an('object');
    expect(data).to.have.property(root).and.be.a(type);
  },

  parseGraphResponse(res, root) {
    const { body } = res;
    const { data } = body;
    return root ? data[root] : data;
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

  stubHash() {
    return sinon.stub(bcrypt, 'hash').resolves('$2a$04$jdkrJXkU92FIF4NcprNKWOcMKoOG28ELDrW2HBpDZFSmY/vxOj4VW');
  },

  /**
   *
   */
  testPaginate(Repo) {
    const paginated = Repo.paginate();
    expect(paginated).to.be.an.instanceOf(Pagination);
    expect(paginated.Model).to.be.a('function');
  },

  /**
   *
   */
  testSearch(Repo) {
    const pagination = { first: 5 };
    const search = { typeahead: { field: 'name', term: 'test' } };
    const paginated = Repo.search({ pagination, search });
    expect(paginated).to.be.an.instanceOf(Pagination);
    expect(paginated.Model).to.be.a('function');
    expect(Repo.search).to.throw(Error, /Cannot destructure property/);
  },

  async testTrimmedField(Model, document, field, { value = ' Trim Me ', expected = 'Trim Me', property } = {}) {
    const prop = property || field;
    const { id } = document;
    document.set(field, value);
    await expect(document.save()).to.be.fulfilled;
    if (field.match(/\./)) {
      await expect(Model.findOne({ _id: id })).to.eventually.have.nested.include({ [prop]: expected });
    } else {
      await expect(Model.findOne({ _id: id })).to.eventually.have.property(field).equal(expected);
    }

  },

  async testUniqueField(Model, doc1, doc2, field, value = 'Unique Name') {
    doc1.set(field, value);
    await expect(doc1.save()).to.be.fulfilled;
    doc2.set(field, value);
    await expect(doc2.save()).to.be.rejectedWith(Error, /E11000 duplicate key error/);
  },

  async testRequiredField(Model, document, field, value) {
    document.set(field, value);
    await expect(document.save()).to.be.rejectedWith(Error, /is required/i);
  },
};
