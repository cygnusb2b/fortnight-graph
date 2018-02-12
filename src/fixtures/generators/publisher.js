const faker = require('faker');

module.exports = () => {
  const now = new Date();
  return {
    name: faker.company.companyName(),
    createdAt: now,
    updatedAt: now,
  };
};
