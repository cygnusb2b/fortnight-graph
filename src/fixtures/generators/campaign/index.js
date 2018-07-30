const faker = require('faker');
const creative = require('./creative');
const criteria = require('./criteria');

module.exports = async ({
  advertiserId,
  placementIds,
  creativeImageId,
  createdById,
  updatedById,
  internalContactIds = [],
  externalContactIds = [],
}) => {
  const creatives = () => {
    const stack = [];
    const num = faker.random.number({ min: 1, max: 5 });
    for (let i = 0; i < num; i += 1) {
      stack.push(creative({ imageId: creativeImageId }));
    }
    return Promise.all(stack);
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
    createdById: await createdById(),
    updatedById: await updatedById(),
    externalLinks: externalLinks(),
    notify: {
      internal: internalContactIds,
      external: externalContactIds,
    },
  };
};
