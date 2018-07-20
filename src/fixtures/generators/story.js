const faker = require('faker');

module.exports = async ({ advertiserId, primaryImageId, imageIds }) => {
  const now = new Date();
  return {
    title: faker.lorem.words(10),
    teaser: faker.lorem.words(10),
    body: faker.lorem.words(10),
    advertiserId: await advertiserId(),
    primaryImageId: await primaryImageId(),
    imageIds: await imageIds(),
    createdAt: now,
    updatedAt: now,
    publishedAt: new Date(),
  };
};
