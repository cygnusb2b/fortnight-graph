const faker = require('faker');

module.exports = () => {
  const now = new Date();
  return {
    name: faker.lorem.words(10),
    teaser: faker.lorem.words(10),
    body: faker.lorem.words(10),
    createdAt: now,
    updatedAt: now,
  };
};
