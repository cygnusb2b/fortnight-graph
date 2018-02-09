const faker = require('faker');

module.exports = ({ advertiserId, creatives }) => {
  const now = new Date();
  return {
    name: faker.random.words(),
    url: faker.internet.url(),
    advertiserId: advertiserId(),
    status: faker.helpers.randomize([
      'Active',
      'Paused',
      'Draft',
      'Deleted',
    ]),
    creatives: creatives(),
    createdAt: now,
    updatedAt: now,
  };
};
