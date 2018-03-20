const faker = require('faker');

module.exports = ({ publisherId } = {}) => {
  const now = new Date();
  return {
    name: faker.random.words(5),
    createdAt: now,
    updatedAt: now,
    publisherId: publisherId(),
  };
};
