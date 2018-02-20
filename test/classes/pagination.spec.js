require('../connections');
const Advertiser = require('../../src/models/advertiser');
const AdvertiserRepo = require('../../src/repositories/advertiser')
const Pagination = require('../../src/classes/pagination');

const createAdvertisers = async (count) => {
  const results = await AdvertiserRepo.seed({ count });
  return results.all();
};

describe('classes/pagination', function() {
  let advertisers;
  before(async function() {
    await AdvertiserRepo.remove();
    advertisers = await createAdvertisers(10);
  });
  after(async function() {
    await AdvertiserRepo.remove();
  });

  describe('#findCursorModel', function() {
    it('should find the appropriate model and fields.', async function() {
      const advertiser = advertisers[0];
      const paginated = new Pagination(Advertiser);
      const promise = paginated.findCursorModel(advertiser.id, { _id: 1 });
      await expect(promise).to.eventually.be.an.instanceOf(Advertiser);
      const found = await promise;
      expect(found.id).to.equal(advertiser.id);
      expect(found.name).to.be.undefined;
    });
    it('should throw an error when no model could be found.', async function() {
      const id = '507f1f77bcf86cd799439011';
      const paginated = new Pagination(Advertiser);
      await expect(paginated.findCursorModel(id)).to.be.rejectedWith(Error, /no record found/i);
    });
  });

  describe('#getEdges', function() {
    it('should return a natural list of models.', async function() {
      const ids = advertisers.slice(0, 5).map(advertiser => advertiser.id);
      const sort = { field: 'id', order: 1 };
      const pagination = { first: 5 };
      const paginated = new Pagination(Advertiser, { sort, pagination });
      const promise = await expect(paginated.getEdges()).to.eventually.be.an('array');
      const results = await promise;
      expect(results.map(model => model.id)).to.deep.equal(ids);
    });
  });

  describe('#getFilter', function() {
    it('should return the proper filter value when no options are present.', async function(){
      const options = { };
      const expected = { };
      const paginated = new Pagination(Advertiser, options);
      // call it twice to simulate saved filter.
      await expect(paginated.getFilter()).to.eventually.deep.equal(expected);
      await expect(paginated.getFilter()).to.eventually.deep.equal(expected);
    });
    it('should return the proper filter value when an after value is present.', async function(){
      const advertiser = advertisers[0];
      const options = {
        pagination: { after: advertiser.id },
      };
      const expected = {
        _id: { $gt: advertiser.id },
      };
      const paginated = new Pagination(Advertiser, options);
      // call it twice to simulate saved filter.
      await expect(paginated.getFilter()).to.eventually.deep.equal(expected);
      await expect(paginated.getFilter()).to.eventually.deep.equal(expected);
    });
    it('should return the proper filter value when an after value is present (descending).', async function(){
      const advertiser = advertisers[0];
      const options = {
        pagination: { after: advertiser.id },
        sort: { order: -1 },
      };
      const expected = {
        _id: { $lt: advertiser.id },
      };
      const paginated = new Pagination(Advertiser, options);
      // call it twice to simulate saved filter.
      await expect(paginated.getFilter()).to.eventually.deep.equal(expected);
      await expect(paginated.getFilter()).to.eventually.deep.equal(expected);
    });
    it('should return the proper filter value when an after value is present, with a non-ID sort.', async function(){
      const advertiser = advertisers[0];
      const options = {
        pagination: { after: advertiser.id },
        sort: { field: 'name' },
      };
      const expected = {
        $or: [
          { name: { $gt: advertiser.name } },
          { name: advertiser.name, _id: { $gt: advertiser.id } },
        ],
      };
      const paginated = new Pagination(Advertiser, options);
      // call it twice to simulate saved filter.
      await expect(paginated.getFilter()).to.eventually.deep.equal(expected);
      await expect(paginated.getFilter()).to.eventually.deep.equal(expected);
    });
    it('should return the proper filter value when an after value is present, with a non-ID sort (descending).', async function(){
      const advertiser = advertisers[0];
      const options = {
        pagination: { after: advertiser.id },
        sort: { field: 'name', order: -1 },
      };
      const expected = {
        $or: [
          { name: { $lt: advertiser.name } },
          { name: advertiser.name, _id: { $lt: advertiser.id } },
        ],
      };
      const paginated = new Pagination(Advertiser, options);
      // call it twice to simulate saved filter.
      await expect(paginated.getFilter()).to.eventually.deep.equal(expected);
      await expect(paginated.getFilter()).to.eventually.deep.equal(expected);
    });
    it('should return the proper filter value when an after value is present, with a non-ID sort (descending), with additional criteria.', async function(){
      const advertiser = advertisers[0];
      const options = {
        criteria: { createdAt: advertiser.createdAt },
        pagination: { after: advertiser.id },
        sort: { field: 'name', order: -1 },
      };
      const expected = {
        createdAt: advertiser.createdAt,
        $or: [
          { name: { $lt: advertiser.name } },
          { name: advertiser.name, _id: { $lt: advertiser.id } },
        ],
      };
      const paginated = new Pagination(Advertiser, options);
      // call it twice to simulate saved filter.
      await expect(paginated.getFilter()).to.eventually.deep.equal(expected);
      await expect(paginated.getFilter()).to.eventually.deep.equal(expected);
    });
  });

  describe('#getTotalCount', function() {
    [1, 10, 50].forEach((first) => {
      const pagination = { first };
      const paginated = new Pagination(Advertiser, { pagination });
      it(`should return a consistent total count when requesting ${first} records.`, async function() {
        await expect(paginated.getTotalCount()).to.eventually.equal(advertisers.length);
      });
    });
  });

  describe('#hasNextPage', function() {
    [
      { first: 1, expected: true },
      { first: 5, expected: true },
      { first: 10, expected: false },
      { first: 15, expected: false },
    ].forEach(({ first, expected }) => {
      const pagination = { first };
      const paginated = new Pagination(Advertiser, { pagination });
      it(`should return ${expected} when requesting ${first} records.`, async function() {
        await expect(paginated.hasNextPage()).to.eventually.equal(expected);
      });
    });
    [
      { first: 1, expected: true },
      { first: 5, expected: true },
      { first: 10, expected: false },
      { first: 15, expected: false },
    ].forEach(({ first, expected }) => {
      const pagination = { first };
      const sort = { field: 'name', order: -1 };
      const paginated = new Pagination(Advertiser, { pagination, sort });
      it(`should return ${expected} when requesting ${first} records while sorting.`, async function() {
        await expect(paginated.hasNextPage()).to.eventually.equal(expected);
      });
    });
  });

  describe('#getEndCursor', function() {
    [1, 5, 10, 15].forEach((first) => {
      const pagination = { first };
      const paginated = new Pagination(Advertiser, { pagination });
      it(`should return the correct cursor value when requesting ${first} records while ascending.`, async function() {
        const expected = first > advertisers.length ? null : advertisers[first - 1].id;
        await expect(paginated.getEndCursor()).to.eventually.equal(expected);
      });
    });
    [1, 5, 10, 15].forEach((first) => {
      const pagination = { first };
      const sort = { order: -1 };
      const paginated = new Pagination(Advertiser, { pagination }, { sort });
      it(`should return the correct cursor value when requesting ${first} records while descending.`, async function() {
        const flipped = advertisers.slice(0).reverse();
        const expected = first > advertisers.length ? null : advertisers[first - 1].id;
        await expect(paginated.getEndCursor()).to.eventually.equal(expected);
      });
    });
  });

  describe('#getSortOrder', function() {
    [-1, '-1', -1.1].forEach((value) => {
      it(`should return -1 when the value is '${value}'.`, function(done) {
        expect(Pagination.getSortOrder(value)).to.equal(-1);
        done();
      });
    });
    [1, 0, '1', 1.1, 2].forEach((value) => {
      it(`should return 1 when the value is '${value}'.`, function(done) {
        expect(Pagination.getSortOrder(value)).to.equal(1);
        done();
      });
    });
  });

  describe('#getSortOrder', function() {
    ['id', '_id', 'createdAt', '', undefined, null].forEach((value) => {
      it(`should return '_id' when the value is '${value}'.`, function(done) {
        expect(Pagination.getSortField(value)).to.equal('_id');
        done();
      });
    });
    ['name', 'updatedAt', 'foo', 'bar'].forEach((value) => {
      it(`should return '${value}' when passed.`, function(done) {
        expect(Pagination.getSortField(value)).to.equal(value);
        done();
      });
    });
  });

  describe('#getSortObject', function() {
    [
      { field: '_id', order: 1 },
      { field: '_id', order: -1 },
      { field: 'id', order: 1 },
      { field: 'id', order: -1 },
      { field: 'createdAt', order: 1 },
      { field: 'createdAt', order: -1 },
    ].forEach((sort) => {
      const expected = { _id: sort.order };
      it(`should return a sort object of ${JSON.stringify(expected)} when the input sort is ${JSON.stringify(sort)}.`, function(done) {
        const paginated = new Pagination(Advertiser, { sort });
        expect(paginated.getSortObject()).to.deep.equal(expected);
        done();
      });
    });
    [
      { field: 'name', order: 1 },
      { field: 'name', order: -1 },
    ].forEach((sort) => {
      const expected = { [sort.field]: sort.order, _id: sort.order };
      it(`should return a sort object of ${JSON.stringify(expected)} when the input sort is ${JSON.stringify(sort)}.`, function(done) {
        const paginated = new Pagination(Advertiser, { sort });
        expect(paginated.getSortObject()).to.deep.equal(expected);
        done();
      });
    });

  });

  describe('#parseSort', function() {
    it('should return a parsed object with field and order.', function() {
      expect(Pagination.parseSort()).to.be.an('object').with.all.keys('field', 'order');
      expect(Pagination.parseSort({ field: 'name', order: -1 })).to.be.an('object').with.all.keys('field', 'order');
    });
  });

  describe('#invertSortObj', function() {
    [
      { field: '_id', order: 1 },
      { field: '_id', order: -1 },
      { field: 'id', order: 1 },
      { field: 'id', order: -1 },
      { field: 'createdAt', order: 1 },
      { field: 'createdAt', order: -1 },
    ].forEach((sort) => {
      const expected = { _id: sort.order * -1 };
      it(`should return a sort object of ${JSON.stringify(expected)} when the input sort is ${JSON.stringify(sort)}.`, function(done) {
        const paginated = new Pagination(Advertiser, { sort });
        expect(paginated.invertSortObj()).to.deep.equal(expected);
        done();
      });
    });
    [
      { field: 'name', order: 1 },
      { field: 'name', order: -1 },
    ].forEach((sort) => {
      const expected = { [sort.field]: sort.order * -1, _id: sort.order * -1 };
      it(`should return a sort object of ${JSON.stringify(expected)} when the input sort is ${JSON.stringify(sort)}.`, function(done) {
        const paginated = new Pagination(Advertiser, { sort });
        expect(paginated.invertSortObj()).to.deep.equal(expected);
        done();
      });
    });
  });

  describe('#limit', function() {
    [undefined, null, 0, -1].forEach((value) => {
      it(`should return a default of 10 when the first value is '${value}'`, function(done) {
        const pagination = { first: value };
        const paginated = new Pagination(Advertiser, { pagination });
        expect(paginated.limit).to.equal(10);
        done();
      });
    });

    [5, '5', 5.5, 5.1, 5.9].forEach((value) => {
      it(`should return a limit of 5 when the first value is '${value}'`, function(done) {
        const pagination = { first: value };
        const paginated = new Pagination(Advertiser, { pagination });
        expect(paginated.limit).to.equal(5);
        done();
      });
    });

    [200, 201, 200.5, '201', 1000].forEach((value) => {
      it(`should return a max of 200 when the first value is '${value}'`, function(done) {
        const pagination = { first: value };
        const paginated = new Pagination(Advertiser, { pagination });
        expect(paginated.limit).to.equal(200);
        done();
      });
    });

  });

});
