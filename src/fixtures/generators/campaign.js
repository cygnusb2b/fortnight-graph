const faker = require('faker');
const shortid = require('shortid');

module.exports = ({ advertiserId }) => ({
  name: faker.company.companyName(),
  cid: shortid.generate(),
  advertiserId: advertiserId(),
  status: faker.helpers.randomize([
    'Active',
    'Paused',
    'Draft',
    'Deleted',
  ]),
  createdAt: faker.date.past().valueOf(),
  updatedAt: faker.date.recent().valueOf(),
});
