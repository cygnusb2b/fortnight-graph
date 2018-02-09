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

  /**
   *
   */
  testPaginate(Repo) {
    const paginated = Repo.paginate();
    expect(paginated).to.be.an.instanceOf(Pagination);
    expect(paginated.Model).to.be.a('function');
  },

  async testTrimmedField(Model, document, field) {
    const { id } = document;
    document.set(field, ' Trim Me ');
    await expect(document.save()).to.be.fulfilled;
    await expect(Model.findOne({ _id: id })).to.eventually.have.property(field).equal('Trim Me');
  },

  async testUniqueField(Model, doc1, doc2, field) {
    doc1.set(field, 'Unique Name');
    await expect(doc1.save()).to.be.fulfilled;
    doc2.set('name', 'Unique Name');
    await expect(doc2.save()).to.be.rejectedWith(Error, /E11000 duplicate key error/);
  },

  async testRequiredField(Model, document, field) {
    const values = ['', null, undefined];
    const promises = [];

    values.forEach((value) => {
      document.set(field, value);
      promises.push(document.save());
    });

    await promises;
    promises.forEach((promise) => {
      expect(promise).to.be.rejectedWith(Error, /is required/i);
    });
  },
};

// it('should be trimmed.', async function() {
//   advertiser.set('name', ' Trim Me ');
//   await expect(advertiser.save()).to.be.fulfilled;
//   await expect(find(advertiser)).to.eventually.have.property('name').equal('Trim Me');
// });
// const names = ['', '  ', null, undefined];
// names.forEach((name) => {
//   it(`should be required and rejected when value is '${name}'.`, async function() {
//     advertiser.set('name', name);
//     await expect(advertiser.save()).to.be.rejectedWith(Error, 'advertiser validation failed: name: Path `name` is required.');
//   });
// });
// it('should be unique.', async function() {
//   advertiser.set('name', 'Unique Name');
//   await expect(advertiser.save()).to.be.fulfilled;
//   const another = fixtures(Advertiser, 1).one();
//   another.set('name', 'Unique Name');
//   await expect(another.save()).to.be.rejectedWith(Error, /E11000 duplicate key error/);
// });
