const { expect } = require('chai');
const Pagination = require('../../src/classes/pagination');

module.exports = {
  testPaginate(Repo) {
    const paginated = Repo.paginate();
    expect(paginated).to.be.an.instanceOf(Pagination);
    expect(paginated.Model).to.be.a('function');
  },
};
