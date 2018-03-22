const faker = require('faker');
const creative = require('./creative');
const criteria = require('./criteria');

module.exports = ({
  advertiserId,
  placementId,
  internalContactIds = [],
  externalContactIds = [],
}) => {
  const creatives = () => {
    const stack = [];
    const num = faker.random.number({ min: 1, max: 5 });
    for (let i = 0; i < num; i += 1) {
      stack.push(creative());
    }
    return stack;
  };

  const externalLinks = () => {
    const stack = [];
    const num = faker.random.number({ min: 1, max: 5 });
    for (let i = 0; i < num; i += 1) {
      stack.push({
        label: faker.internet.domainWord(),
        url: faker.internet.url(),
      });
    }
    return stack;
  };

  const now = new Date();
  return {
    name: faker.random.words(),
    description: faker.lorem.paragraph(),
    url: faker.internet.url(),
    advertiserId: advertiserId(),
    status: faker.helpers.randomize([
      'Active',
      'Paused',
      'Draft',
      'Deleted',
    ]),
    creatives: creatives(),
    criteria: criteria({ placementId }),
    createdAt: now,
    updatedAt: now,
    externalLinks: externalLinks(),
    notify: {
      internal: internalContactIds,
      external: externalContactIds,
    },
  };
};
