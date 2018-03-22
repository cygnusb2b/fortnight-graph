const faker = require('faker');

module.exports = () => {
  const now = new Date();
  return {
    name: faker.company.companyName(),
    logo: faker.image.imageUrl(100, 100, undefined, undefined, true),
    createdAt: now,
    updatedAt: now,
  };
};
