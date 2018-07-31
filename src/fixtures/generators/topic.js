const faker = require('faker');

module.exports = async ({ publisherId, createdById, updatedById } = {}) => {
  const now = new Date();
  return {
    name: faker.lorem.words(10),
    createdAt: now,
    updatedAt: now,
    publisherId: await publisherId(),
    createdById: await createdById(),
    updatedById: await updatedById(),
  };
};
