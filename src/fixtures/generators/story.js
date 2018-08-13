const faker = require('faker');

module.exports = async ({
  advertiserId,
  publisherId,
  primaryImageId,
  imageIds,
  createdById,
  updatedById,
}) => {
  const now = new Date();
  return {
    title: faker.lorem.words(10),
    teaser: faker.lorem.words(10),
    body: faker.lorem.words(10),
    advertiserId: await advertiserId(),
    publisherId: await publisherId(),
    primaryImageId: await primaryImageId(),
    imageIds: await imageIds(),
    createdAt: now,
    updatedAt: now,
    createdById: await createdById(),
    updatedById: await updatedById(),
    publishedAt: new Date(),
  };
};
