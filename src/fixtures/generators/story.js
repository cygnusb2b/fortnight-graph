const faker = require('faker');

module.exports = ({ advertiserId, primaryImageId, imageIds }) => {
  const now = new Date();
  return {
    title: faker.lorem.words(10),
    teaser: faker.lorem.words(10),
    body: faker.lorem.words(10),
    advertiserId: advertiserId(),
    primaryImageId: primaryImageId(),
    imageIds: imageIds(),
    createdAt: now,
    updatedAt: now,
    publishedAt: new Date(),
  };
};
