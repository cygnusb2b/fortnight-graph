const faker = require('faker');
const shortid = require('shortid');

module.exports = ({ advertiserId, creatives }) => ({
  name: faker.random.words(),
  cid: shortid.generate(),
  advertiserId: advertiserId(),
  status: faker.helpers.randomize([
    'Active',
    'Paused',
    'Draft',
    'Deleted',
  ]),
  creatives: creatives(),
  createdAt: faker.date.past().valueOf(),
  updatedAt: faker.date.recent().valueOf(),
});
