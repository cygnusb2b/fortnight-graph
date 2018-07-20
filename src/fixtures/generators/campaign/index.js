const faker = require('faker');
const creative = require('./creative');
const criteria = require('./criteria');

module.exports = async ({
  advertiserId,
  placementIds,
  creativeImageId,
  internalContactIds = [],
  externalContactIds = [],
}) => {
  const creatives = async () => {
    const stack = [];
    const num = faker.random.number({ min: 1, max: 5 });
    for (let i = 0; i < num; i += 1) {
      stack.push(await creative({ imageId: creativeImageId }));
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
    advertiserId: await advertiserId(),
    status: faker.helpers.randomize([
      'Active',
      'Paused',
      'Draft',
      'Deleted',
    ]),
    creatives: await creatives(),
    criteria: await criteria({ placementIds }),
    createdAt: now,
    updatedAt: now,
    externalLinks: externalLinks(),
    notify: {
      internal: internalContactIds,
      external: externalContactIds,
    },
  };
};
