const faker = require('faker');

module.exports = ({ publisherId } = {}) => {
  const now = new Date();
  return {
    name: faker.random.words(),
    createdAt: now,
    updatedAt: now,
    publisherId: publisherId(),
  };
};
