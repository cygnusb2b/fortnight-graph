const faker = require('faker');

module.exports = async ({ createdById, updatedById }) => {
  const now = new Date();
  return {
    name: faker.lorem.words(10),
    logo: faker.image.imageUrl(100, 100, undefined, undefined, true),
    createdAt: now,
    updatedAt: now,
    website: faker.internet.url(),
    createdById: await createdById(),
    updatedById: await updatedById(),
  };
};
