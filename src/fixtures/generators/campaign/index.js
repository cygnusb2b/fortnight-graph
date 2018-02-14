const faker = require('faker');
const creative = require('./creative');

module.exports = ({ advertiserId }) => {
  const creatives = () => {
    const stack = [];
    const num = faker.random.number({ min: 1, max: 5 });
    for (let i = 0; i < num; i += 1) {
      stack.push(creative());
    }
    return stack;
  };

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
