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
});
