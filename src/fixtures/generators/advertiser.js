const faker = require('faker');

module.exports = async ({
  internalContactIds = [],
  externalContactIds = [],
  createdById,
  updatedById,
}) => {
  const now = new Date();

  return {
    name: faker.lorem.words(10),
    logo: faker.image.imageUrl(100, 100, undefined, undefined, true),
    createdAt: now,
    updatedAt: now,
    createdById: await createdById(),
    updatedById: await updatedById(),
    website: faker.internet.url(),
    notify: {
      internal: internalContactIds,
      external: externalContactIds,
    },
  };
};
